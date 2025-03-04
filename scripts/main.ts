import dotenv from "dotenv";
import { PuppeteerWebBaseLoader, Browser, Page } from '@langchain/community/document_loaders/web/puppeteer';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";

dotenv.config();

const {
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_INDEX_NAME,
  PINECONE_INDEX_HOST,
} = process.env;

const scrapeUrls = [
    "https://ja.wikipedia.org/wiki/Category:2024%E5%B9%B4%E3%81%AE%E3%83%86%E3%83%AC%E3%83%93%E3%82%A2%E3%83%8B%E3%83%A1",
];

const scrapePage = async () => {
  const pageData = [];
  for await (const url of scrapeUrls) {
    try {
      const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
        gotoOptions: {
          waitUntil: "domcontentloaded",
        },
        evaluate: async (page: Page, browser: Browser) => {
          const result = await page.evaluate(() => document.body.innerHTML);
          await browser.close();
          return result;
        },
      });
  
      const data = await loader.scrape();
      pageData.push(data);
    } catch (e) {
      console.error(e);
    }
  }
  return pageData;
};


const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

const convertVector = async (pageData: string[]) => {
  const vectors = [] as number[][];
  const chunks = [] as string[];
  for (const page of pageData) {
    const pageChunks = await splitter.splitText(page);
    for await (const chunk of pageChunks) {
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
        encoding_format: 'float',
      });

      const vector = embedding.data[0].embedding;
      console.log(vector);
      vectors.push(vector);
      chunks.push(chunk);
    }
  }
  return { vectors, chunks };
};

const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY || '',
});
const index = pinecone.index(PINECONE_INDEX_NAME || '', PINECONE_INDEX_HOST || '');

const storeVectors = async (vectors: number[][], chunks: string[]) => {
  const upserts = vectors.map((vector, i) => {
    return {
      id: `vector-${i}`,
      values: vector,
      metadata: { text: chunks[i] },
    } as PineconeRecord;
  });

  try {
    await index.upsert(upserts);
  } catch (error) {
    console.error(error);
  }
};

const main = async () => {
  const pageData = await scrapePage();
  const { vectors, chunks } = await convertVector(pageData);
  if (vectors && chunks) {
    await storeVectors(vectors, chunks);
  }
};

main();
