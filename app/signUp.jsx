import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { globalstyles } from "../styles/globalStyles";
import * as Yup from "yup";
import { Formik } from "formik";
import { useAuth } from "../context/authProvider";
// import { AuthProvider } from "./context/authContext";

const SignUpSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(4, "Short Name!")
    .required("Full name is required"),
  email: Yup.string().email("Email Invalid!").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be 8 chars!")
    .required("Password is required"),
});

export default function SignUp() {
  const { SignUp } = useAuth();
  const [modalMessage, setModalMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("Success");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, ); // [] as dabalameera akka yeroo hunda hin deebine
const handleSignUpAction = async (values, { setSubmitting, resetForm }) => {
  try {
    setSubmitting(true);

    // 'signUp' (U guddaa) fayyadami
    const result = await signUp(values.fullName, values.email, values.password);

    // Appwrite irraa 'resSession' deebiee jira jechuun
    // as keessatti 'result.success' true ta'a.
    if (result && result.success) {
      setModalType("Success");
      setModalMessage("Account successfully created!");
      setModalVisible(true);

      // Form-icha qulqulleessi
      resetForm();

      // Sekondii 2 booda gara Signin-tti ergi
      setTimeout(() => {
        setModalVisible(false);
        router.push("/Signin");
      }, 2000);
    } else {
      // Yoo 'success' false ta'e (fakkeenyaaf email duraan jiru)
      setModalType("Error");
      setModalMessage(result.message || "Signup failed.");
      setModalVisible(true);
    }
  } catch (error) {
    // Yoo koodiin 'catch' keessa gale
    setModalType("Error");
    setModalMessage("Dogoggora uumameera: " + error.message);
    setModalVisible(true);
  } finally {
    setSubmitting(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={globalstyles.cont}
    >
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView contentContainerStyle={globalstyles.scrollContainer}>
          <View style={globalstyles.headerArea}>
            <Text style={globalstyles.titl}>Create Account</Text>
            <Text style={globalstyles.subtitle}>Sign up to get started!</Text>
          </View>

          <Formik
            initialValues={{ fullName: "", email: "", password: "" }}
            validationSchema={SignUpSchema}
            onSubmit={handleSignUpAction}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
            }) => (
              <View style={globalstyles.formArea}>
                {/* Full Name */}
                <View style={globalstyles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#666"
                    style={globalstyles.icon}
                  />
                  <TextInput
                    style={globalstyles.input}
                    placeholder="Full Name"
                    value={values.fullName}
                    onChangeText={handleChange("fullName")}
                    onBlur={handleBlur("fullName")}
                  />
                </View>
                {touched.fullName && errors.fullName && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 5 }}>
                    {errors.fullName}
                  </Text>
                )}

                {/* Email */}
                <View style={globalstyles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#666"
                    style={globalstyles.icon}
                  />
                  <TextInput
                    style={globalstyles.input}
                    placeholder="Email Address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 5 }}>
                    {errors.email}
                  </Text>
                )}

                {/* Password */}
                <View style={globalstyles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#666"
                    style={globalstyles.icon}
                  />
                  <TextInput
                    style={globalstyles.input}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 5 }}>
                    {errors.password}
                  </Text>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    globalstyles.button,
                    { opacity: isSubmitting ? 0.6 : 1, marginTop: 20 },
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={globalstyles.buttonText}>sign Up</Text>
                  )}
                </TouchableOpacity>

                {/* Footer */}
                <View style={globalstyles.footer}>
                  <Text style={globalstyles.footerTex}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/Signin")}>
                    <Text style={globalstyles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>

          {/* Modal Pop-up */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={globalstyles.overlay}>
              <View style={globalstyles.modalContainer}>
                <Ionicons
                  name={
                    modalType === "Success"
                      ? "checkmark-circle"
                      : "alert-circle"
                  }
                  size={70}
                  color={modalType === "Success" ? "#4CAF50" : "#F44336"}
                />
                <Text style={globalstyles.modalText}>{modalMessage}</Text>
                <TouchableOpacity
                  style={[
                    globalstyles.modalButton,
                    {
                      backgroundColor:
                        modalType === "Success" ? "#4CAF50" : "#F44336",
                    },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    if (modalType === "Success") {
                      router.push("/Signin");
                    }
                  }}
                >
                  <Text style={globalstyles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
