import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      alert("Logged out successfully!");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to AI Codebase Refactor</h1>
      <p className="text-lg text-gray-600 mb-6">
        Your hub for managing and refactoring legacy code with AI assistance.
      </p>
      <button
        onClick={handleLogout}
        className="p-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}