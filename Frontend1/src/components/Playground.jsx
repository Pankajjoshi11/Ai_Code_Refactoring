import { motion } from 'framer-motion';

export default function Playground() {
  return (
    <motion.div
      className="relative z-10 flex items-center justify-center min-h-screen px-4 text-center text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div>
        <h1 className="text-4xl font-bold mb-6">Playground</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Welcome to the Playground! This area is for authenticated users to experiment and test features.
        </p>
      </div>
    </motion.div>
  );
}