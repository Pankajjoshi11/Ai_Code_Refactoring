import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleAuth = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    toast.error("Please fill out all fields.");
    return;
  }

  try {
    if (isLogin) {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("authToken", token);
      toast.success("Login successful!");
      navigate(`/${userCred.user.uid}`);
    } else {
      const userCred = await createUserWithEmailAndPassword(auth, email, password); // ✅ FIXED LINE
      const token = await userCred.user.getIdToken(); // Optional: store token here too
      localStorage.setItem("authToken", token);
      toast.success("Sign up successful!");
      navigate(`/${userCred.user.uid}`); // ✅ Redirect using UID
    }
  } catch (error) {
    toast.error(error.message);
  }
};

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("authToken", token);
      toast.success("Google Sign-In successful!");
      navigate(`/${userCred.user.uid}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Toaster position="top-right" />

      {/* Animated background */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-slowZoom"
        style={{ backgroundImage: "url('/background.png')" }}
      ></div>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Auth form */}
      <motion.div
        className="relative z-10 flex items-center justify-center min-h-screen"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="bg-[#1c1c1e] text-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-1 text-center">
            {isLogin ? "Welcome back !" : "Create your account"}
          </h2>
          <p className="text-sm text-center mb-6">
            {isLogin ? "Are you a newcomer?" : "Already a member?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 hover:underline ml-1 transition-colors duration-200"
            >
              {isLogin ? "Sign up here" : "Login here"}
            </button>
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            <div className="relative">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className={`peer w-full px-3 pt-4 pb-2 bg-[#2c2c2e] text-white rounded-md border border-[#3a3a3c] focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-transparent`}
                  placeholder="Email"
                  id="email"
                />
                <label
                  htmlFor="email"
                  className="absolute left-3 top-2 text-sm text-gray-400 transition-all 
                            peer-placeholder-shown:top-3.5 
                            peer-placeholder-shown:text-base 
                            peer-placeholder-shown:text-gray-500 
                            peer-focus:top-1 
                            peer-focus:text-xs 
                            peer-focus:text-purple-400 
                            peer-valid:top-1.5 
                            peer-valid:text-sm"
                >
                  Email
                </label>
              </div>

            </div>

            <div className="relative">
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full p-3 bg-[#2c2c2e] text-white rounded-md placeholder-transparent border border-[#3a3a3c] focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Password"
              />
              <label
                  htmlFor="email"
                  className="absolute left-3 top-2 text-sm text-gray-400 transition-all 
                            peer-placeholder-shown:top-3.5 
                            peer-placeholder-shown:text-base 
                            peer-placeholder-shown:text-gray-500 
                            peer-focus:top-1 
                            peer-focus:text-xs 
                            peer-focus:text-purple-400 
                            peer-valid:top-1.5 
                            peer-valid:text-sm"
                >
                  Password
                </label>
            </div>

            <button
              type="submit"
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-md hover:scale-105 hover:shadow-lg transform transition-all duration-300 ease-in-out"
            >
              {isLogin ? "LOGIN" : "SIGN UP"}
            </button>
          </form>

          <button
            onClick={handleGoogleSignIn}
            className="mt-4 flex items-center justify-center gap-2 p-3 border border-yellow-500 rounded-md text-white hover:bg-[#2c2c2e] hover:scale-105 transform transition-all duration-300 w-full"
          >
            <img
              src="http://pluspng.com/img-png/google-logo-png-open-2000.png"
              alt="Google"
              className="w-5 h-5"
            />
            Login with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
