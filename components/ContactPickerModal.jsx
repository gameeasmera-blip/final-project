import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactPickerModal({
  visible,
  onClose,
  onSelectContact,
}) {
  const [contacts, setContacts] = useState([]);
  const [joinedUsers, setJoinedUsers] = useState([]); // Namoota App Keenyaatti Dabalaman (Page Keenya)
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'joined'
  const [sortBy, setSortBy] = useState("name");

  // Chat State
  const [selectedUserForChat, setSelectedUserForChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    if (visible) {
      loadContacts();
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      if (!Contacts || typeof Contacts.requestPermissionsAsync !== "function") {
        alert("Expo Contacts native module is not ready. Restart dev server!");
        setLoading(false);
        return;
      }

      const { status } = await Contacts.requestPermissionsAsync();

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        });

        if (data && data.length > 0) {
          const formattedContacts = data.map((item, index) => ({
            ...item,
            lastSeen: index % 3 === 0 ? "Online" : `${index + 1} hrs ago`,
            isJoined: false, // Jalqaba irratti maammila haaraadha
          }));

          setContacts(formattedContacts);
        }
      } else {
        alert("Contacts dhiyeessuuf eeyyama bilbilaa kennaa!");
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Contact gara Page Keenyaatti Dabaluu (Join / Add)
  const handleJoinUser = (contact, phoneNumber) => {
    const newUser = {
      ...contact,
      phone: phoneNumber,
      avatar: contact.name ? contact.name[0].toUpperCase() : "?",
      isJoined: true,
    };

    // Main Contacts List keessatti status jijjiiruu
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, isJoined: true } : c)),
    );

    // Joined Users (Page Keenya) keessatti dabaluu
    setJoinedUsers((prev) => [
      newUser,
      ...prev.filter((u) => u.id !== contact.id),
    ]);

    // Parent screen-iif ta'e deebisuu
    if (onSelectContact) {
      onSelectContact(newUser);
    }
  };

  // 2. Erga Joined Ta'e Booda Chat Banuu
  const openChatWithUser = (user) => {
    setSelectedUserForChat(user);
    setMessages([
      {
        id: "1",
        text: `Akkam ${user.name}! Baga gara app keenyaatti dhuftan.`,
        sender: "them",
        time: "Just now",
      },
    ]);
  };

  // Ergaa Erguu
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "me",
      time: "Just now",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
  };

  // Invite Link
  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: "Hey! Join me on this application to connect with us!",
      });
    } catch (error) {
      console.error("Error sharing invite:", error);
    }
  };

  const currentList = activeTab === "all" ? contacts : joinedUsers;

  const filteredContacts = currentList
    .filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      } else {
        if (a.lastSeen === "Online") return -1;
        if (b.lastSeen === "Online") return 1;
        return (a.lastSeen || "").localeCompare(b.lastSeen || "");
      }
    });

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Active Chat Screen View */}
          {selectedUserForChat ? (
            <View style={styles.chatWrapper}>
              <View style={styles.chatHeader}>
                <TouchableOpacity onPress={() => setSelectedUserForChat(null)}>
                  <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.chatProfileBox}>
                  <View style={styles.chatAvatar}>
                    <Text style={styles.avatarText}>
                      {selectedUserForChat.avatar}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.chatProfileName}>
                      {selectedUserForChat.name}
                    </Text>
                    <Text
                      style={[
                        styles.chatProfileStatus,
                        selectedUserForChat.lastSeen === "Online" && {
                          color: "#2ed573",
                        },
                      ]}
                    >
                      {selectedUserForChat.lastSeen}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === "me"
                        ? styles.myMessage
                        : styles.theirMessage,
                    ]}
                  >
                    <Text
                      style={
                        item.sender === "me"
                          ? styles.myMessageText
                          : styles.theirMessageText
                      }
                    >
                      {item.text}
                    </Text>
                    <Text style={styles.messageTime}>{item.time}</Text>
                  </View>
                )}
              />

              <View style={styles.inputBar}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Ergaa barreessi..."
                  value={inputMessage}
                  onChangeText={setInputMessage}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendMessage}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Contact List View */
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Namoota Join Gochuuf Filadhu</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#888"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search contacts..."
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.inviteCard}
                onPress={handleInviteFriends}
              >
                <View style={styles.inviteIconBox}>
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteTitle}>Invite Friends</Text>
                  <Text style={styles.inviteSub}>
                    Affaarraa namootaaf ergia
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>

              {/* Navigation Tabs: All Contacts vs Joined Users (Page Keenya) */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "all" && styles.activeTab]}
                  onPress={() => setActiveTab("all")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "all" && styles.activeTabText,
                    ]}
                  >
                    All Contacts ({contacts.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "joined" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("joined")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "joined" && styles.activeTabText,
                    ]}
                  >
                    Joined Users ({joinedUsers.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sort By Controller */}
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>Sort by:</Text>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    sortBy === "name" && styles.activeSortBtn,
                  ]}
                  onPress={() => setSortBy("name")}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      sortBy === "name" && styles.activeSortText,
                    ]}
                  >
                    Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    sortBy === "lastSeen" && styles.activeSortBtn,
                  ]}
                  onPress={() => setSortBy("lastSeen")}
                >
                  <Text
                    style={[
                      styles.sortBtnText,
                      sortBy === "lastSeen" && styles.activeSortText,
                    ]}
                  >
                    Last Seen
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator
                  size="large"
                  color="#ff4d6d"
                  style={{ marginVertical: 30 }}
                />
              ) : (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>
                      {activeTab === "joined"
                        ? "Namni dabalame hin jiru. 'Join / Add' tuquun dabali!"
                        : "Contact-ni hin argamne."}
                    </Text>
                  }
                  renderItem={({ item }) => {
                    const phoneNumber =
                      item.phoneNumbers && item.phoneNumbers.length > 0
                        ? item.phoneNumbers[0].number
                        : item.phone || "No Phone";

                    return (
                      <View style={styles.contactCard}>
                        {/* Profile Avatar */}
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {item.name ? item.name[0].toUpperCase() : "?"}
                          </Text>
                        </View>

                        {/* Profile Information */}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{item.name}</Text>
                          <Text style={styles.phone}>{phoneNumber}</Text>
                          <Text
                            style={[
                              styles.lastSeenText,
                              {
                                color:
                                  item.lastSeen === "Online"
                                    ? "#2ed573"
                                    : "#888888",
                                fontWeight:
                                  item.lastSeen === "Online"
                                    ? "bold"
                                    : "normal",
                              },
                            ]}
                          >
                            {item.lastSeen}
                          </Text>
                        </View>

                        {/* Logical Button: Yoo Joined Ta'ee Jiraate Chat Icon (💬), Yoo Ta'uu Baate "Join / Add" Button */}
                        {item.isJoined ? (
                          <TouchableOpacity
                            style={styles.chatIconButton}
                            onPress={() => openChatWithUser(item)}
                          >
                            <Ionicons
                              name="chatbubble-ellipses"
                              size={20}
                              color="#fff"
                            />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.joinBtn}
                            onPress={() => handleJoinUser(item, phoneNumber)}
                          >
                            <Text style={styles.joinBtnText}>+ Join / Add</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f2f6",
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff0f3",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  inviteIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ff4d6d",
  },
  inviteSub: {
    fontSize: 11,
    color: "#666",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff4d6d",
  },
  tabText: {
    fontSize: 13,
    color: "#777",
  },
  activeTabText: {
    color: "#ff4d6d",
    fontWeight: "bold",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: "#777",
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f1f2f6",
  },
  activeSortBtn: {
    backgroundColor: "#ff4d6d",
  },
  sortBtnText: {
    fontSize: 11,
    color: "#555",
  },
  activeSortText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 30,
    fontSize: 13,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  name: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
  },
  phone: {
    fontSize: 12,
    color: "#777",
  },
  lastSeenText: {
    fontSize: 11,
    marginTop: 2,
  },
  joinBtn: {
    backgroundColor: "#ff4d6d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  joinBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatIconButton: {
    backgroundColor: "#2ed573", // Dynamic Chat Icon bifa magariisaa (Green)
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  /* Chat Styles */
  chatWrapper: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  chatProfileBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
  },
  chatProfileName: {
    fontWeight: "bold",
    fontSize: 14,
  },
  chatProfileStatus: {
    fontSize: 11,
    color: "#888",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#ff4d6d",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f2f6",
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 9,
    color: "#ddd",
    alignSelf: "flex-end",
    marginTop: 2,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#ff4d6d",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
