import React, { useState } from "react";

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import ContactPickerModal from "../components/ContactPickerModal";

export default function ExampleScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const handleSelectedContact = (contact) => {
    setSelectedUser(contact);

    console.log("Joined User:", contact);

    // Asi irratti Appwrite Database keessatti save gochuu dandeessa!
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Dashboard Keenya</Text>

      {/* Button-oota Icon Garagaraa Qaban */}

      <View style={styles.actionRow}>
        {/* 1. Icon Contact Add/Join */}

        <TouchableOpacity
          style={styles.iconCard}
          onPress={() => setModalVisible(true)}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#ff4d6d" }]}>
            <Ionicons name="person-add" size={24} color="#fff" />
          </View>

          <Text style={styles.cardText}>Add / Join</Text>
        </TouchableOpacity>

        {/* 2. Icon Chat Qofa Ta'e */}

        <TouchableOpacity
          style={styles.iconCard}
          onPress={() => setModalVisible(true)}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#2ed573" }]}>
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </View>

          <Text style={styles.cardText}>Chats</Text>
        </TouchableOpacity>
      </View>

      {/* Qorannoo/Result Namni Join Ta'ee Yoo Jiraate */}

      {selectedUser && (
        <View style={styles.resultCard}>
          <Ionicons name="checkmark-circle" size={22} color="#2ed573" />

          <View>
            <Text style={styles.resultTitle}>Dabalamee Jira:</Text>

            <Text style={styles.resultSub}>
              {selectedUser.name} ({selectedUser.phone})
            </Text>
          </View>
        </View>
      )}

      {/* Component Modal Keenya */}

      <ContactPickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectContact={handleSelectedContact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: "#f8f9fa",

    padding: 20,
  },

  headerTitle: {
    fontSize: 22,

    fontWeight: "bold",

    marginBottom: 30,

    color: "#222",
  },

  actionRow: {
    flexDirection: "row",

    gap: 20,

    marginBottom: 30,
  },

  iconCard: {
    backgroundColor: "#fff",

    padding: 16,

    borderRadius: 16,

    alignItems: "center",

    width: 120,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.1,

    shadowRadius: 4,

    elevation: 3,
  },

  iconCircle: {
    width: 50,

    height: 50,

    borderRadius: 25,

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 8,
  },

  cardText: {
    fontSize: 13,

    fontWeight: "600",

    color: "#444",
  },

  resultCard: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    backgroundColor: "#eccc6822",

    padding: 12,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: "#2ed57355",

    width: "90%",
  },

  resultTitle: {
    fontSize: 12,

    color: "#666",
  },

  resultSub: {
    fontSize: 14,

    fontWeight: "bold",

    color: "#222",
  },
});
