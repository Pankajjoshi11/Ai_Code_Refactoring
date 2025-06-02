import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCred.user.getIdToken();
        localStorage.setItem("authToken", token);
        alert("Login successful!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Sign up successful!");
        setIsLogin(true);
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
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>
      <form onSubmit={handleAuth} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>
      <button onClick={handleGoogleSignIn} style={styles.googleButton}>
        Sign In with Google
      </button>
      <p style={styles.toggleText}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <button onClick={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "300px",
    margin: "100px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    textAlign: "center",
    fontFamily: "Arial",
  },
  form: { display: "flex", flexDirection: "column" },
  input: {
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    cursor: "pointer",
  },
  googleButton: {
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#4285F4",
    color: "white",
    cursor: "pointer",
  },
  toggleText: {
    marginTop: "15px",
    fontSize: "14px",
  },
  toggleButton: {
    marginLeft: "5px",
    border: "none",
    background: "none",
    color: "#007BFF",
    cursor: "pointer",
  },
};