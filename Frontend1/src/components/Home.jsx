import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Home({ redirectPath = "/upload" }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero Section */}
      <motion.div
        className="relative z-10 flex items-center justify-center min-h-[70vh] px-4 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div>
          <h1 className="text-4xl leading-relaxed sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            Activate AI Assistance For Programming
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Save Context & Generate Tailored Output according to your Codebase, Database Schema, & Tech Stack.
          </p>
          <button
            onClick={() => navigate(redirectPath)}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:scale-105 transform transition-all duration-300 ease-in-out"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </>
  );
}