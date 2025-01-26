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
const openai_1 = require("openai");
const game_twitter_plugin_1 = __importDefault(require("@virtuals-protocol/game-twitter-plugin"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// OpenAI Configuration
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
});
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
    getAgentState: () => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            username: "SerCryptic",
            follower_count: 5000,
            tweet_count: 300,
        });
    }),
});
// Call OpenAI API to Generate Dynamic Replies
const generateResponse = (prompt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const completion = yield openai.completions.create({
            model: 'o1-mini',
            prompt,
            max_tokens: 100,
            temperature: 0.7,
        });
        return ((_b = (_a = completion.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.text.trim()) || '...';
    }
    catch (error) {
        console.error("Error communicating with OpenAI API:", error);
        return "An error occurred while generating a response.";
    }
});
// Periodically Search and Reply to Tweets
const searchAndReply = () => __awaiter(void 0, void 0, void 0, function* () {
    const query = "blockchain OR crypto OR $GODL";
    // Execute the search with a logger
    const response = yield twitterPlugin.searchTweetsFunction.execute({ query: { value: query } }, (msg) => console.log(`Search Logger: ${msg}`));
    // Extract the actual tweets from the response
    const tweets = response.result; // Assuming `response.result` contains the tweets
    if (tweets && Array.isArray(tweets)) {
        for (const tweet of tweets) {
            const replyPrompt = `Reply as SerCryptic, the witty, cyberpunk knight of the Ledgerverse: "${tweet.text}"`;
            const replyContent = yield generateResponse(replyPrompt);
            // Execute the reply with a logger
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
setInterval(() => {
    console.log("Initiating periodic search and reply task...");
    searchAndReply();
}, 300000); // 5 minutes
// Run the Agent
(() => __awaiter(void 0, void 0, void 0, function* () {
    // Define a logger
    serCrypticAgent.setLogger((agent, message) => {
        var _a, _b;
        const timestamp = new Date().toISOString();
        console.log(`-----[${agent.name}]-----`);
        console.log(`[${timestamp}] ${message}`);
        // Log metrics like tweet count and follower count
        (_b = (_a = serCrypticAgent.getAgentState) === null || _a === void 0 ? void 0 : _a.call(serCrypticAgent)) === null || _b === void 0 ? void 0 : _b.then(state => {
            console.log(`Metrics: Followers - ${state.follower_count}, Tweets - ${state.tweet_count}`);
        });
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
