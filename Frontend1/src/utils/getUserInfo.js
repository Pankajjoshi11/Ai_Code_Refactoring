import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";

export default function ProfileDropdown() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []
)
}
