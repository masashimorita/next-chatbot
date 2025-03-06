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
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1]?.content;

  let docContext = "";
  const embeddings = await openAIClient.embeddings.create({
    model: "text-embedding-3-small",
    input: latestMessage,
    encoding_format: 'float',
  });
}
