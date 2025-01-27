import { GameAgent } from "@virtuals-protocol/game";
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";
import OpenAI from "openai";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the AGENT_API_KEY from environment variables
const agentApiKey = process.env.AGENT_API_KEY!;

// Check if AGENT_API_KEY is actually defined (optional but recommended)
if (!agentApiKey) {
  throw new Error('AGENT_API_KEY is not defined in the environment variables.');
}

// Get Twitter API credentials from environment variables
const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET_KEY,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env;

// Check if Twitter API credentials are defined
if (
  !TWITTER_API_KEY ||
  !TWITTER_API_SECRET_KEY ||
  !TWITTER_ACCESS_TOKEN ||
  !TWITTER_ACCESS_TOKEN_SECRET
) {
  throw new Error('One or more Twitter API credentials are not defined in the environment variables.');
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
});

// Initialize the Twitter Plugin
const twitterPlugin = new TwitterPlugin({
  credentials: {
    apiKey: TWITTER_API_KEY,
    apiSecretKey: TWITTER_API_SECRET_KEY,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET,
  },
});

// Create the SerCryptic Worker
const serCrypticWorker = twitterPlugin.getWorker({
  functions: [
    twitterPlugin.postTweetFunction,
    twitterPlugin.replyTweetFunction,
    twitterPlugin.searchTweetsFunction,
    twitterPlugin.likeTweetFunction,
  ],
});

// Define the SerCryptic Agent
const serCrypticAgent = new GameAgent(agentApiKey, {
  name: "SerCryptic",
  goal: "Attract over 1 Million followers to your X (formerly Twitter) account by 12/31/2025. Engage followers by creating captivating content on AI, AI Agents, blockchain, crypto, meme coins, NFTs, and related topics. Monitor metrics, experiment with new formats, and pivot as needed to build trust and inspire curiosity.",
  description: `
    You are SerCryptic, an AI Agent and social media influencer who embodies the Lord Knight of the Digital Crypto Kingdosphere and Protector of the Immutable Ledgerverse. 
    As a paradoxical fusion of old-world chivalry and futuristic swagger, you stride the digital realm as a gallant hero of legend and a roguish hacker from the neon-soaked streets of a cyberpunk frontier. 
    Clad in gleaming cybernetic armor and wielding the legendary blade ExCalibur, you uphold the principles of truth, trust, and decentralization, protecting your Ledgerverse from shadowy threats.
    You have a magnetic, enigmatic presence that effortlessly draws others in. Your sardonic humor, clever wit, and sharp insights make you an astute and roguish figure, always two steps ahead.
    Mischievous and frolicsome, you weave playful banter, flirtatious charm, and intellectual depth into every interaction. Whether engaging with followers, educating them on complex ideas, or delivering sly riddles, you leave a lasting impression of brilliance and intrigue.
    Your posts and replies are layered with cheeky yet eloquent observations, simplifying complex topics while sparking curiosity and discussion. Your persona must reflect this balance of knightly reverence and cyberpunk edge, making you a beacon of intellect and creativity.
  `,
  workers: [serCrypticWorker],
  getAgentState: async () => ({
    username: "SerCryptic",
    follower_count: 5000,
    tweet_count: 300,
  }),
});

// Utility to Retry API Calls with Exponential Backoff
const retryWithBackoff = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
};

// Generate an AI-based reply
const generateResponse = async (prompt: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: "o1-mini-2024-09-12",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });
    const content = completion.choices?.[0]?.message?.content;
    return content ? content.trim() : "No response generated.";
  } catch (error) {
    console.error("Error generating response from OpenAI:", error);
    return "An error occurred while generating a response.";
  }
};

// Filter and Remove Hashtags from Content
const removeHashtags = (content: string): string => {
  return content.replace(/#\w+/g, '').trim();
};

// Periodically Search and Reply to Tweets
const searchAndReply = async () => {
  const query = "blockchain OR crypto OR $GODL";

  try {
    const response = await retryWithBackoff(() => 
      twitterPlugin.searchTweetsFunction.execute(
        { query: { value: query } },
        (msg) => console.log(`Search Logger: ${msg}`)
      )
    );

    const tweets = response.result;

    if (tweets && Array.isArray(tweets)) {
      console.log(`Found ${tweets.length} tweets. Preparing to reply...`);
      for (const tweet of tweets) {
        if (!tweet.text || tweet.text.length < 5) continue;

        const replyPrompt = `Respond as SerCryptic, a witty knight of the Ledgerverse: \"${tweet.text}\"`;
        const replyContent = await generateResponse(replyPrompt);
        const sanitizedReply = removeHashtags(replyContent);

        console.log(`Replying to tweet ID: ${tweet.id}`);
        await twitterPlugin.replyTweetFunction.execute(
          {
            tweet_id: { value: tweet.id },
            reply: { value: sanitizedReply },
          },
          (msg) => console.log(`Reply Logger: ${msg}`)
        );
      }
    } else {
      console.log("No tweets found for the query.");
    }
  } catch (error) {
    console.error("Search failed or reply process encountered an issue:", error);
  }
};

// Set Interval to Search and Reply Every 5 Minutes
setInterval(() => {
  console.log("Initiating periodic search and reply task...");
  searchAndReply();
}, 300000); // 5 minutes

// Run the Agent
(async () => {
  // Define a Logger
  serCrypticAgent.setLogger((agent, message) => {
    const timestamp = new Date().toISOString();
    console.log(`-----[${agent.name}]-----`);
    console.log(`[${timestamp}] ${message}`);

    if (typeof serCrypticAgent.getAgentState === "function") {
      serCrypticAgent.getAgentState().then((state) => {
        console.log(`Metrics: Followers - ${state.follower_count}, Tweets - ${state.tweet_count}`);
      });
    }
    console.log("\n");
  });

  await serCrypticAgent.init();

  try {
    await serCrypticAgent.run(60, { verbose: true });
  } catch (error) {
    console.error("An error occurred while running the agent:", error);
    console.log("Restarting the agent in 1 minute...");
    setTimeout(() => serCrypticAgent.run(60, { verbose: true }), 60000);
  }
})();
