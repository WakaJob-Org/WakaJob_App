import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';

import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    ActivityIndicator,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import {
    useNavigation,
    useRoute,
    RouteProp,
} from '@react-navigation/native';

import {
    useChat,
    ClientChatMessage,
} from '../../context/ChatContext';

import { useAuth } from '../../context/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import ChatBubblesSkeleton from '../../components/ChatBubblesSkeleton';
import jobService from '../../services/jobService';

type ChatConversationRouteProp =
    RouteProp<
        AppStackParamList,
        'ChatConversation'
    >;

const getMessageKey = (
    message: ClientChatMessage
) =>
    message.clientId ||
    message.id ||
    message._id ||
    `${message.sender_id}_${message.created_at}_${message.content}`;

const mapRawJobToJob = (
    rawJob: any,
    jobId: string,
    fallbackTitle: string
) => ({
    id: rawJob?.id || jobId,
    title:
        rawJob?.title ||
        rawJob?.position_vacant ||
        fallbackTitle,
    company:
        rawJob?.users?.full_name,
    location:
        rawJob?.location,
    salary:
        rawJob?.salary ||
        'Competitive',
    type:
        rawJob?.job_type ||
        'Full-time',
    description:
        rawJob?.description,
    category:
        rawJob?.category,
    postedAt:
        rawJob?.created_at,
    imageUrl:
        rawJob?.image_url ||
        rawJob?.job_image,
    requirements:
        rawJob?.qualifications
            ? rawJob.qualifications
                  .split(',')
            : [],
    employerId:
        rawJob?.employer_id,
});

const initialsFor = (
    name: string
) =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

const formatBubbleTime = (
    iso: string
) => {
    if (!iso) return '';

    const date =
        new Date(iso);

    return date.toLocaleTimeString(
        undefined,
        {
            hour: 'numeric',
            minute: '2-digit',
        }
    );
};

const StatusIcon: React.FC<{
    status: ClientChatMessage['status'];
}> = ({ status }) => {
    if (status === 'sending') {
        return (
            <Ionicons
                name="time-outline"
                size={13}
                color="rgba(255,255,255,0.75)"
            />
        );
    }

    if (status === 'failed') {
        return (
            <Ionicons
                name="alert-circle"
                size={13}
                color="#FCA5A5"
            />
        );
    }

    return (
        <Ionicons
            name="checkmark"
            size={13}
            color="rgba(255,255,255,0.85)"
        />
    );
};

const ChatScreen: React.FC =
    () => {
        const insets =
            useSafeAreaInsets();

        const navigation =
            useNavigation<any>();

        const route =
            useRoute<ChatConversationRouteProp>();

        const {
            conversationId,
            jobId,
            jobTitle,
            otherUserId,
            otherUserName,
            otherUserPhoto,
        } = route.params;

        const { user } =
            useAuth();

        const myId =
            user?.id || '';

        const {
            fetchHistory,
            sendMessage,
            retryMessage,
            subscribe,
            setActiveConversationId,
            markConversationRead,
            isSocketConnected,
            hasEverConnected,
        } = useChat();

        const [
            messages,
            setMessages,
        ] = useState<
            ClientChatMessage[]
        >([]);

        const [
            loading,
            setLoading,
        ] = useState(true);

        const [
            historyError,
            setHistoryError,
        ] = useState(false);

        const [
            historyRetryCount,
            setHistoryRetryCount,
        ] = useState(0);

        const [
            draft,
            setDraft,
        ] = useState('');

        const [
            isKeyboardVisible,
            setIsKeyboardVisible,
        ] = useState(false);

        const [
            openingJob,
            setOpeningJob,
        ] = useState(false);

        const [
            jobPreview,
            setJobPreview,
        ] = useState<any>(null);

        const listRef =
            useRef<FlatList>(null);

        /**
         * Single safe way of adding/replacing
         * messages.
         */
        const upsertMessage =
            useCallback(
                (
                    message: ClientChatMessage
                ) => {
                    setMessages(
                        (previous) => {
                            const key =
                                getMessageKey(
                                    message
                                );

                            const index =
                                previous.findIndex(
                                    (item) =>
                                        getMessageKey(
                                            item
                                        ) ===
                                        key
                                );

                            if (
                                index >= 0
                            ) {
                                const next =
                                    [
                                        ...previous,
                                    ];

                                next[index] =
                                    message;

                                return next;
                            }

                            return [
                                ...previous,
                                message,
                            ];
                        }
                    );
                },
                []
            );

        useEffect(() => {
            if (!jobId) return;

            let cancelled =
                false;

            (async () => {
                try {
                    const rawJob =
                        await jobService.getJobById(
                            jobId
                        );

                    if (!cancelled) {
                        setJobPreview(
                            mapRawJobToJob(
                                rawJob,
                                jobId,
                                jobTitle
                            )
                        );
                    }
                } catch (error) {
                    console.error(
                        'Failed to load job for chat:',
                        error
                    );
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [jobId, jobTitle]);

        useEffect(() => {
            const showEvent =
                Platform.OS === 'ios'
                    ? 'keyboardWillShow'
                    : 'keyboardDidShow';

            const hideEvent =
                Platform.OS === 'ios'
                    ? 'keyboardWillHide'
                    : 'keyboardDidHide';

            const showSub =
                Keyboard.addListener(
                    showEvent,
                    () =>
                        setIsKeyboardVisible(
                            true
                        )
                );

            const hideSub =
                Keyboard.addListener(
                    hideEvent,
                    () =>
                        setIsKeyboardVisible(
                            false
                        )
                );

            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }, []);

        useEffect(() => {
            setActiveConversationId(
                conversationId
            );

            markConversationRead(
                conversationId
            );

            let cancelled =
                false;

            const loadHistory =
                async () => {
                    setLoading(true);
                    setHistoryError(false);

                    try {
                        const history =
                            await fetchHistory(
                                conversationId
                            );

                        if (!cancelled) {
                            /**
                             * Deduplicate history
                             * before rendering.
                             */
                            const unique =
                                Array.from(
                                    new Map(
                                        history.map(
                                            (
                                                message
                                            ) => [
                                                getMessageKey(
                                                    message
                                                ),
                                                message,
                                            ]
                                        )
                                    ).values()
                                );

                            setMessages(
                                unique
                            );
                        }
                    } catch (error) {
                        console.error(
                            'Failed to load conversation:',
                            error
                        );

                        if (!cancelled) {
                            setHistoryError(
                                true
                            );
                        }
                    } finally {
                        if (
                            !cancelled
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                };

            loadHistory();

            const unsubscribe =
                subscribe(
                    conversationId,
                    (
                        incoming
                    ) => {
                        upsertMessage(
                            incoming
                        );

                        if (
                            incoming.sender_id !==
                            myId
                        ) {
                            markConversationRead(
                                conversationId
                            );
                        }
                    }
                );

            return () => {
                cancelled = true;

                unsubscribe();

                setActiveConversationId(
                    null
                );
            };
        }, [
            conversationId,
            historyRetryCount,
            fetchHistory,
            subscribe,
            upsertMessage,
            myId,
            setActiveConversationId,
            markConversationRead,
        ]);

        const scrollToEnd =
            useCallback(() => {
                requestAnimationFrame(
                    () => {
                        listRef.current?.scrollToEnd(
                            {
                                animated:
                                    true,
                            }
                        );
                    }
                );
            },
            []
        );

        useEffect(() => {
            if (!loading) {
                scrollToEnd();
            }
        }, [
            messages.length,
            loading,
            scrollToEnd,
        ]);

        const handleSend =
            () => {
                const content =
                    draft.trim();

                if (!content) return;

                setDraft('');

                const optimistic =
                    sendMessage(
                        conversationId,
                        otherUserId,
                        content
                    );

                /**
                 * Do not blindly append.
                 *
                 * upsertMessage prevents the same
                 * clientId from appearing twice.
                 */
                upsertMessage(
                    optimistic
                );
            };

        const handleRetry =
            (
                message: ClientChatMessage
            ) => {
                const sending = {
                    ...message,
                    status:
                        'sending' as const,
                };

                upsertMessage(
                    sending
                );

                retryMessage(
                    conversationId,
                    message
                );
            };

        const handleOpenJob =
            async () => {
                if (
                    !jobId ||
                    openingJob
                ) {
                    return;
                }

                if (jobPreview) {
                    navigation.navigate(
                        'JobDetails',
                        {
                            job: jobPreview,
                            alreadyApplied:
                                true,
                        }
                    );

                    return;
                }

                setOpeningJob(true);

                try {
                    const rawJob =
                        await jobService.getJobById(
                            jobId
                        );

                    const job =
                        mapRawJobToJob(
                            rawJob,
                            jobId,
                            jobTitle
                        );

                    navigation.navigate(
                        'JobDetails',
                        {
                            job,
                            alreadyApplied:
                                true,
                        }
                    );
                } catch {
                    navigation.navigate(
                        'JobDetails',
                        {
                            job: {
                                id: jobId,
                                title:
                                    jobTitle,
                            },
                            alreadyApplied:
                                true,
                        }
                    );
                } finally {
                    setOpeningJob(
                        false
                    );
                }
            };

        const jobQuoteSubtitle =
            [
                jobPreview?.location,
                jobPreview?.salary,
            ]
                .filter(Boolean)
                .join(' · ') ||
            'Tap to view job details';

        const renderItem =
            ({
                item,
                index,
            }: {
                item: ClientChatMessage;
                index: number;
            }) => {
                const mine =
                    item.sender_id ===
                    myId;

                const isOpeningMessage =
                    index === 0 &&
                    !!jobId;

                return (
                    <View
                        style={[
                            styles.bubbleRow,
                            mine
                                ? styles.bubbleRowMine
                                : styles.bubbleRowTheirs,
                        ]}
                    >
                        <View
                            style={[
                                styles.bubble,
                                mine
                                    ? styles.bubbleMine
                                    : styles.bubbleTheirs,
                            ]}
                        >
                            {isOpeningMessage && (
                                <TouchableOpacity
                                    style={[
                                        styles.jobQuoteInline,
                                        mine
                                            ? styles.jobQuoteInlineMine
                                            : styles.jobQuoteInlineTheirs,
                                    ]}
                                    onPress={
                                        handleOpenJob
                                    }
                                >
                                    <View
                                        style={[
                                            styles.jobQuoteAccent,
                                            mine &&
                                                styles.jobQuoteAccentMine,
                                        ]}
                                    />

                                    <View
                                        style={
                                            styles.jobQuoteTextWrap
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.jobQuoteTitle,
                                                mine &&
                                                    styles.jobQuoteTitleMine,
                                            ]}
                                            numberOfLines={
                                                1
                                            }
                                        >
                                            {jobTitle ||
                                                'Job'}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.jobQuoteSubtitle,
                                                mine &&
                                                    styles.jobQuoteSubtitleMine,
                                            ]}
                                            numberOfLines={
                                                1
                                            }
                                        >
                                            {openingJob
                                                ? 'Opening job…'
                                                : jobQuoteSubtitle}
                                        </Text>
                                    </View>

                                    {openingJob && (
                                        <ActivityIndicator
                                            size="small"
                                            color={
                                                mine
                                                    ? '#FFFFFF'
                                                    : '#1972ca'
                                            }
                                        />
                                    )}
                                </TouchableOpacity>
                            )}

                            <Text
                                style={[
                                    styles.bubbleText,
                                    mine &&
                                        styles.bubbleTextMine,
                                ]}
                            >
                                {
                                    item.content
                                }
                            </Text>

                            <View
                                style={
                                    styles.bubbleMeta
                                }
                            >
                                <Text
                                    style={[
                                        styles.bubbleTime,
                                        mine &&
                                            styles.bubbleTimeMine,
                                    ]}
                                >
                                    {formatBubbleTime(
                                        item.created_at ||
                                            ''
                                    )}
                                </Text>

                                {mine && (
                                    <StatusIcon
                                        status={
                                            item.status
                                        }
                                    />
                                )}
                            </View>
                        </View>

                        {mine &&
                            item.status ===
                                'failed' && (
                                <TouchableOpacity
                                    onPress={() =>
                                        handleRetry(
                                            item
                                        )
                                    }
                                    style={
                                        styles.retryRow
                                    }
                                >
                                    <Ionicons
                                        name="warning"
                                        size={
                                            12
                                        }
                                        color="#EF4444"
                                    />

                                    <Text
                                        style={
                                            styles.retryText
                                        }
                                    >
                                        Tap to retry
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </View>
                );
            };

        return (
            <KeyboardAvoidingView
                style={
                    styles.container
                }
                behavior={
                    Platform.OS ===
                    'ios'
                        ? 'padding'
                        : undefined
                }
                keyboardVerticalOffset={
                    insets.top
                }
            >
                <StatusBar style="light" />

                <View
                    style={[
                        styles.header,
                        {
                            paddingTop:
                                insets.top +
                                10,
                        },
                    ]}
                >
                    <TouchableOpacity
                        onPress={() =>
                            navigation.goBack()
                        }
                        style={
                            styles.backBtn
                        }
                    >
                        <Ionicons
                            name="chevron-back"
                            size={24}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>

                    {otherUserPhoto ? (
                        <Image
                            source={{
                                uri: otherUserPhoto,
                            }}
                            style={
                                styles.headerAvatarImage
                            }
                        />
                    ) : (
                        <View
                            style={
                                styles.headerAvatarFallback
                            }
                        >
                            <Text
                                style={
                                    styles.headerAvatarInitials
                                }
                            >
                                {initialsFor(
                                    otherUserName
                                )}
                            </Text>
                        </View>
                    )}

                    <Text
                        style={
                            styles.headerName
                        }
                        numberOfLines={1}
                    >
                        {otherUserName ||
                            'Wakajob User'}
                    </Text>
                </View>

                {!!jobTitle && (
                    <View
                        style={
                            styles.jobBanner
                        }
                    >
                        <Ionicons
                            name="briefcase-outline"
                            size={14}
                            color="#1972ca"
                        />

                        <Text
                            style={
                                styles.jobBannerText
                            }
                            numberOfLines={1}
                        >
                            {jobTitle}
                        </Text>
                    </View>
                )}

                {hasEverConnected &&
                    !isSocketConnected && (
                        <View
                            style={
                                styles.offlineBanner
                            }
                        >
                            <Text
                                style={
                                    styles.offlineBannerText
                                }
                            >
                                Connection temporarily
                                unavailable. Messages
                                will be sent when the
                                connection returns.
                            </Text>
                        </View>
                    )}

                {loading ? (
                    <ChatBubblesSkeleton />
                ) : historyError ? (
                    <View
                        style={
                            styles.historyErrorContainer
                        }
                    >
                        <Ionicons
                            name="cloud-offline-outline"
                            size={40}
                            color="#9CA3AF"
                        />

                        <Text
                            style={
                                styles.historyErrorTitle
                            }
                        >
                            Couldn't load
                            messages
                        </Text>

                        <Text
                            style={
                                styles.historyErrorSubtitle
                            }
                        >
                            Check your connection
                            and try again.
                        </Text>

                        <TouchableOpacity
                            style={
                                styles.historyErrorRetryBtn
                            }
                            onPress={() =>
                                setHistoryRetryCount(
                                    (c) =>
                                        c + 1
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.historyErrorRetryText
                                }
                            >
                                Retry
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(
                            item
                        ) =>
                            getMessageKey(
                                item
                            )
                        }
                        renderItem={
                            renderItem
                        }
                        contentContainerStyle={
                            styles.listContent
                        }
                        onContentSizeChange={
                            scrollToEnd
                        }
                    />
                )}

                <View
                    style={[
                        styles.inputBar,
                        {
                            paddingBottom:
                                isKeyboardVisible
                                    ? 8
                                    : Math.max(
                                          insets.bottom,
                                          12
                                      ),
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={
                            styles.attachBtn
                        }
                        disabled
                    >
                        <Ionicons
                            name="attach-outline"
                            size={22}
                            color="#9CA3AF"
                        />
                    </TouchableOpacity>

                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Type a message"
                        placeholderTextColor="#9CA3AF"
                        value={draft}
                        onChangeText={
                            setDraft
                        }
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            !draft.trim() &&
                                styles.sendBtnDisabled,
                        ]}
                        onPress={
                            handleSend
                        }
                        disabled={
                            !draft.trim()
                        }
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color="#FFFFFF"
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },

    header: {
        backgroundColor: '#1972ca',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 14,
        gap: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },

    backBtn: {
        padding: 4,
    },

    headerAvatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },

    headerAvatarFallback: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor:
            'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerAvatarInitials: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },

    headerName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },

    jobBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    jobBannerText: {
        fontSize: 12,
        color: '#1972ca',
        fontWeight: '600',
        flex: 1,
    },

    offlineBanner: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    offlineBannerText: {
        fontSize: 12,
        color: '#B45309',
        fontWeight: '600',
    },

    listContent: {
        padding: 16,
        gap: 4,
    },

    historyErrorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 4,
    },

    historyErrorTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginTop: 8,
    },

    historyErrorSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },

    historyErrorRetryBtn: {
        backgroundColor: '#1972ca',
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    historyErrorRetryText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },

    bubbleRow: {
        marginBottom: 8,
        maxWidth: '80%',
    },

    bubbleRowMine: {
        alignSelf: 'flex-end',
        alignItems: 'flex-end',
    },

    bubbleRowTheirs: {
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
    },

    jobQuoteInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: -14,
        marginTop: -10,
        marginBottom: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },

    jobQuoteInlineTheirs: {
        backgroundColor:
            'rgba(25,114,202,0.08)',
    },

    jobQuoteInlineMine: {
        backgroundColor:
            'rgba(0,0,0,0.12)',
    },

    jobQuoteAccent: {
        width: 3,
        alignSelf: 'stretch',
        borderRadius: 2,
        backgroundColor: '#1972ca',
    },

    jobQuoteAccentMine: {
        backgroundColor: '#FFFFFF',
    },

    jobQuoteTextWrap: {
        flex: 1,
    },

    jobQuoteTitle: {
        fontSize: 13,
        color: '#1972ca',
        fontWeight: '700',
    },

    jobQuoteTitleMine: {
        color: '#FFFFFF',
    },

    jobQuoteSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1,
    },

    jobQuoteSubtitleMine: {
        color: 'rgba(255,255,255,0.8)',
    },

    bubble: {
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        overflow: 'hidden',
    },

    bubbleMine: {
        backgroundColor: '#1972ca',
        borderBottomRightRadius: 4,
    },

    bubbleTheirs: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 4,
    },

    bubbleText: {
        fontSize: 14,
        color: '#111827',
        flexShrink: 1,
    },

    bubbleTextMine: {
        color: '#FFFFFF',
    },

    bubbleMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        alignSelf: 'flex-end',
    },

    bubbleTime: {
        fontSize: 10,
        color: '#9CA3AF',
    },

    bubbleTimeMine: {
        color: 'rgba(255,255,255,0.75)',
    },

    retryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },

    retryText: {
        fontSize: 11,
        color: '#EF4444',
        fontWeight: '600',
    },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },

    attachBtn: {
        padding: 8,
    },

    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
        maxHeight: 100,
    },

    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1972ca',
        alignItems: 'center',
        justifyContent: 'center',
    },

    sendBtnDisabled: {
        backgroundColor: '#BFDBFE',
    },
});

export default ChatScreen;