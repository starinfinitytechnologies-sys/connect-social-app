import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, VerifiedBadge } from '../components/Avatar';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS } from '../theme';

const QUICK_REPLIES = [
  'Hi! Great to connect.',
  'Are you available this week?',
  'Could you share more about your work?',
];

function MessageBubble({ message, professional }) {
  const isMine = message.sender === 'me';

  return (
    <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
      {!isMine ? (
        <Avatar
          initials={professional.initials}
          size={28}
          background={professional.avatarSoft}
          color={professional.avatarColor}
          style={styles.bubbleAvatar}
        />
      ) : null}

      <View style={[styles.bubbleColumn, isMine && styles.bubbleColumnMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextTheirs]}>
            {message.text}
          </Text>
        </View>
        <Text style={[styles.timeText, isMine && styles.timeTextMine]}>{message.time}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { activeChat, closeChat, sendMessage } = useApp();
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  if (!activeChat || activeChat.relation?.status !== 'accepted') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.lockedState}>
          <View style={styles.lockedIcon}>
            <View style={styles.lockedInner} />
          </View>
          <Text style={styles.lockedTitle}>Chat is locked</Text>
          <Text style={styles.lockedText}>
            Direct messages unlock after a connection request is accepted.
          </Text>
          <Pressable onPress={closeChat} style={styles.lockedButton}>
            <Text style={styles.lockedButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const messages = activeChat.relation.messages || [];
  const canSend = draft.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;

    sendMessage(activeChat.id, draft);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={closeChat}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close chat"
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>

          <Avatar
            initials={activeChat.initials}
            size={40}
            background={activeChat.avatarSoft}
            color={activeChat.avatarColor}
            online={activeChat.online}
          />

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text numberOfLines={1} style={styles.headerName}>
                {activeChat.name}
              </Text>
              {activeChat.verified ? <VerifiedBadge size={13} /> : null}
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: activeChat.online ? COLORS.success : COLORS.textSubtle },
                ]}
              />
              <Text numberOfLines={1} style={styles.headerStatus}>
                {activeChat.online ? 'Online now' : activeChat.headline}
              </Text>
            </View>
          </View>

          <View style={styles.privatePill}>
            <Text style={styles.privateText}>PRIVATE</Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} professional={activeChat} />
          )}
          style={styles.flex}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.emptyMessagesContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: messages.length > 0 })
          }
          ListHeaderComponent={
            messages.length > 0 ? (
              <View style={styles.dayDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dayText}>Today</Text>
                <View style={styles.dividerLine} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Avatar
                initials={activeChat.initials}
                size={72}
                background={activeChat.avatarSoft}
                color={activeChat.avatarColor}
              />
              <Text style={styles.emptyTitle}>You are connected with {activeChat.name.split(' ')[0]}</Text>
              <Text style={styles.emptyText}>
                Say hello and start the conversation. Messages stay private between you two.
              </Text>

              <View style={styles.quickReplies}>
                {QUICK_REPLIES.map((reply) => (
                  <Pressable
                    key={reply}
                    onPress={() => sendMessage(activeChat.id, reply)}
                    style={({ pressed }) => [styles.quickReply, pressed && styles.pressed]}
                  >
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
        />

        <View style={styles.composerBar}>
          <View style={styles.inputShell}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${activeChat.name.split(' ')[0]}...`}
              placeholderTextColor={COLORS.textSubtle}
              style={styles.input}
              multiline
              maxLength={1000}
            />

            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={({ pressed }) => [
                styles.sendButton,
                !canSend && styles.sendButtonDisabled,
                pressed && canSend && styles.sendButtonPressed,
              ]}
            >
              <Text style={styles.sendGlyph}>↑</Text>
            </Pressable>
          </View>

          <Text style={styles.composerHint}>
            Connection accepted · Messages are private
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  backGlyph: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 34,
    marginTop: -3,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  headerStatus: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
  privatePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  privateText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  emptyMessagesContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  dayDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dayText: {
    color: COLORS.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowTheirs: {
    justifyContent: 'flex-start',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleAvatar: {
    marginRight: 8,
    marginBottom: 17,
  },
  bubbleColumn: {
    maxWidth: '76%',
  },
  bubbleColumnMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 6,
    ...SHADOWS.soft,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 6,
    ...SHADOWS.floating,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  messageTextTheirs: {
    color: COLORS.text,
  },
  messageTextMine: {
    color: COLORS.surface,
  },
  timeText: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 4,
  },
  timeTextMine: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  quickReplies: {
    marginTop: 22,
    width: '100%',
    gap: 8,
  },
  quickReply: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  quickReplyText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  composerBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 110,
    paddingTop: 9,
    paddingBottom: 8,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    ...SHADOWS.floating,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonPressed: {
    opacity: 0.82,
  },
  sendGlyph: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: -1,
  },
  composerHint: {
    color: COLORS.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  lockedState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  lockedTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 18,
  },
  lockedText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  lockedButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
  },
  lockedButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});
