import { NextResponse } from "next/server";
import OpenAI from "openai";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Pinecone } from "@pinecone-database/pinecone";

const {
  OPENAI_API_KEY,
  PINECONE_API_KEY,
  PINECONE_INDEX_NAME,
  PINECONE_INDEX_HOST,
} = process.env;


const openAIClient = new OpenAI({ apiKey: OPENAI_API_KEY });

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY! });
const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME!, PINECONE_INDEX_HOST);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    let docContext = "";
    const embeddings = await openAIClient.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: 'float',
    });

    const query = {
      vector: embeddings.data[0].embedding,
      topK: 10,
      includeMetadata: true,
    };

    const vectors = await pineconeIndex.query(query);
    vectors.matches.forEach(match => docContext += match.metadata);

    const template = {
      role: "system",
      content: `
        あなたはアニメについて詳しいです。
        コンテキストで受け取った情報を元に、アニメについての質問に答えることができます。
        これらのコンテキストは最近のWikiページから抽出されました。
        もしない情報がある場合はあなたの情報を使わないでください。
        レスポンスに画像は含めないでください。
        ----------------
        ${docContext}
        ----------------
        Questions: ${latestMessage}
        ----------------
  
      `,
    };

    const result = await streamText({
      model: openai('gpt-4o-mini'),
      prompt: template.content,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    return NextResponse.json({ message: 'error occurred...'}, { status: 400 });
  }
}
