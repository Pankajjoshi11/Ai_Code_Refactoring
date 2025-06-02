import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCred.user.getIdToken();
        localStorage.setItem("authToken", token);
        alert("Login successful!");
        navigate("/home");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Sign up successful!");
        setIsLogin(true);
        navigate("/home");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCred = await signInWithPopup(auth, provider);
      const token = await userCred.user.getIdToken();
      localStorage.setItem("authToken", token);
      alert("Google Sign-In successful!");
      navigate("/home");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-6">{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <button
        onClick={handleGoogleSignIn}
        className="mt-4 p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full"
      >
        Sign In with Google
      </button>
      <p className="mt-4 text-sm">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="ml-1 text-blue-500 hover:underline"
        >
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
}