import React, { useContext, createContext, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { account, ID } from "../service/appwrite";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    init();
  }, ); // [] dabalameera akka yeroo tokko qofa hojjetuuf

  const init = async () => {
    await checkAuth();
    setLoading(false);
  };

 const checkAuth = async () => {
   try {
     // Namni galee jiraachuu isaa mirkaneessuuf
     const responseUser = await account.get();
     setUser(responseUser);

     const responseSession = await account.getSession("current");
     setSession(responseSession);
   } catch  {
     // Yoo namni hin jirre ta'e 'Guest' jechuudha, console irratti error hin baasin
     setUser(null);
     setSession(null);
   }
 };
  const signUp = async (fullName, email, password) => {
    setLoading(true);
    try {
      try {
        await account.deleteSession("current");
      } catch {
        /* No session */
      }

      const res = await account.create(ID.unique(), email, password, fullName);
      const resSession = await account.createEmailPasswordSession(
        email,
        password,
      );

      setSession(resSession);
      setUser(res);
      return { success: true, message: "Account successfully created!" };
    } catch (error) {
      return { success: false, message: error.message || "Signup failed" };
    } finally {
      setLoading(false);
    }
  };

  // SIRREEFFAMA GUDDAA: Signin function asitti sirreeffameera
  const Signin = async (responseSession) => {
    setLoading(true);
    try {
      // 1. Session state-tti galchi
      setSession(responseSession);

      // 2. Data user Appwrite irraa fidi
      const responseUser = await account.get();
      setUser(responseUser);

      return { success: true };
    } catch (error) {
      console.log("Signin Context Error:", error);
      setSession(null);
      setUser(null);
      return { success: false, error: error.message || "Signin Failed" };
    } finally {
      setLoading(false);
    }
  };

 const Signout = async () => {
   setLoading(true);
   
   try {
     // Session jiraachuu isaa osoo hin mirkaneessin haquuf hin yaalin
     await account.deleteSession("current");
   } catch  {
     // Yoo session hin jirre caluma jedhi
     console.log("Session kanaan dura haqameera");
   } finally {
     // State qulqulleessi
     setUser(null);
     setSession(null);
     setLoading(false);
   }
   
 };

  const contextData = { user, loading, session, signUp, Signin, Signout };

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#ff4d6d" />
          <Text style={styles.text}>Loading...</Text>
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 10,
    color: "#333",
  },
});
