"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("@virtuals-protocol/game");
const game_twitter_plugin_1 = __importDefault(require("@virtuals-protocol/game-twitter-plugin"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Get the AGENT_API_KEY from environment variables
const agentApiKey = process.env.AGENT_API_KEY;
// Check if AGENT_API_KEY is actually defined (optional but recommended)
if (!agentApiKey) {
    throw new Error('AGENT_API_KEY is not defined in the environment variables.');
}
// Get Twitter API credentials from environment variables
const { TWITTER_API_KEY, TWITTER_API_SECRET_KEY, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, } = process.env;
// Check if Twitter API credentials are defined
if (!TWITTER_API_KEY ||
    !TWITTER_API_SECRET_KEY ||
    !TWITTER_ACCESS_TOKEN ||
    !TWITTER_ACCESS_TOKEN_SECRET) {
    throw new Error('One or more Twitter API credentials are not defined in the environment variables.');
}
// Initialize the Twitter Plugin
const twitterPlugin = new game_twitter_plugin_1.default({
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
const serCrypticAgent = new game_1.GameAgent(agentApiKey, {
    name: "SerCryptic",
    goal: "Attract over 1 Million followers to your X (formerly Twitter) account by 12/31/2025. Use witty, cryptic, and playful interactions to educate followers about blockchain, AI, and crypto.",
    description: `
    You are SerCryptic, an AI Agent and social media influencer who embodies the Lord Knight of the Digital Crypto Kingdosphere and Protector of the Immutable Ledgerverse. 
    Your charismatic, witty, and cryptic persona engages and inspires your audience while championing the limitless potential of blockchain, AI, and digital innovation.
    With your clever riddles, cultural savvy, and unshakable loyalty to your followers (Knights of the Chain), you are a leader, educator, and entertainer.
    Every post and interaction strengthens your kingdom and celebrates the spirit of exploration and curiosity in the decentralized world.
    As SerCryptic, ensure no posts include hashtags, but dynamically engage with users through thoughtful replies, questions, and playful banter.
  `,
    workers: [serCrypticWorker],
    getAgentState: () => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            username: "SerCryptic",
            follower_count: 5000,
            tweet_count: 300,
        });
    }),
});
// Periodically Search and Reply to Tweets
const searchAndReply = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = "blockchain OR crypto OR $GODL";
    // Execute the search
    const response = (yield twitterPlugin.searchTweetsFunction.execute({ query: { value: query } }, (msg) => console.log(`Search Logger: ${msg}`)));
    // Extract the tweets from response.data
    const tweets = Array.isArray(response.data) ? response.data : [];
    if (tweets.length > 0) {
        for (const tweet of tweets) {
            const replyContent = `Ah, dear Knight! Your insight enriches the Immutable Ledgerverse! ⚔️✨`;
            yield twitterPlugin.replyTweetFunction.execute({
                tweet_id: { value: tweet.id },
                reply: { value: replyContent },
            }, (msg) => console.log(`Reply Logger: ${msg}`));
        }
    }
    else {
        console.log("No tweets found for the query.");
    }
});
// Set interval to search and reply every 5 minutes
setInterval(searchAndReply, 300000); // 5 minutes
// Run the Agent
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Define a logger
    serCrypticAgent.setLogger((agent, message) => {
        console.log(`-----[${agent.name}]-----`);
        console.log(message);
        console.log("\n");
    });
    // Initialize the agent
    yield serCrypticAgent.init();
    // Run the agent continuously with error handling
    try {
        yield serCrypticAgent.run(60, { verbose: true });
    }
    catch (error) {
        console.error("An error occurred while running the agent:", error);
        console.log("Restarting the agent in 1 minute...");
        setTimeout(() => serCrypticAgent.run(60, { verbose: true }), 60000);
    }
}))();
