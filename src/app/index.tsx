function HomeScreen() {

    // @section:imports @depends:[]
    const React = require('react');
    const { useState, useEffect, useContext, useMemo, useCallback } = React;
    const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, ActivityIndicator, FlatList, Image, Linking } = require('react-native');
    const WebView = require('react-native-webview').WebView;
    const { MaterialIcons } = require('@expo/vector-icons');
    const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
    // const { createNativeStackNavigator } = require('@react-navigation/native-stack');
    // @end:imports

    // @section:theme @depends:[]
    const storageStrategy = 'local';
    const primaryColor = '#ed3a3a';
    const accentColor = '#f755a1';
    const backgroundColor = '#F8FAFC';
    const cardColor = '#FFFFFF';
    const textPrimary = '#1E293B';
    const textSecondary = '#64748B';
    const designStyle = 'modern';
    // @end:theme

    // @section:navigation-setup @depends:[]
    const Tab = createBottomTabNavigator();
    // const Stack = createNativeStackNavigator();
    // @end:navigation-setup

    // @section:ThemeContext @depends:[theme]
    const ThemeContext = React.createContext();
    const ThemeProvider = function (props) {
        const darkModeState = useState(false);
        const darkMode = darkModeState[0];
        const setDarkMode = darkModeState[1];

        const lightTheme = useMemo(function () {
            return {
                colors: {
                    primary: primaryColor,
                    accent: accentColor,
                    background: backgroundColor,
                    card: cardColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    border: '#E5E7EB',
                    success: '#10B981',
                    error: '#EF4444',
                    warning: '#F59E0B'
                }
            };
        }, []);

        const darkTheme = useMemo(function () {
            return {
                colors: {
                    primary: '#A78BFA',
                    accent: '#C084FC',
                    background: '#0F172A',
                    card: '#1E293B',
                    textPrimary: '#F1F5F9',
                    textSecondary: '#CBD5E1',
                    border: '#334155',
                    success: '#10B981',
                    error: '#EF4444',
                    warning: '#F59E0B'
                }
            };
        }, []);

        const theme = darkMode ? darkTheme : lightTheme;

        const toggleDarkMode = useCallback(function () {
            setDarkMode(function (prev) { return !prev; });
        }, []);

        const value = useMemo(function () {
            return { theme: theme, darkMode: darkMode, toggleDarkMode: toggleDarkMode, designStyle: designStyle };
        }, [theme, darkMode, toggleDarkMode]);

        return React.createElement(ThemeContext.Provider, { value: value }, props.children);
    };

    const useTheme = function () { return useContext(ThemeContext); };
    // @end:ThemeContext

    // @section:FavoritesContext @depends:[theme]
    const FavoritesContext = React.createContext();
    const FavoritesProvider = function (props) {
        const favoritesState = useState([]);
        const favorites = favoritesState[0];
        const setFavorites = favoritesState[1];

        const addFavorite = useCallback(function (post) {
            const isAlreadyFavorite = favorites.some(function (fav) { return fav.id === post.id; });
            if (!isAlreadyFavorite) {
                setFavorites(function (prev) { return prev.concat([post]); });
                Platform.OS === 'web' ? window.alert('Added to favorites') : Alert.alert('Success', 'Added to favorites');
            }
        }, [favorites]);

        const removeFavorite = useCallback(function (postId) {
            setFavorites(function (prev) {
                return prev.filter(function (fav) { return fav.id !== postId; });
            });
            Platform.OS === 'web' ? window.alert('Removed from favorites') : Alert.alert('Success', 'Removed from favorites');
        }, []);

        const toggleFavorite = useCallback(function (post) {
            const isAlreadyFavorite = favorites.some(function (fav) { return fav.id === post.id; });
            if (isAlreadyFavorite) {
                removeFavorite(post.id);
            } else {
                addFavorite(post);
            }
        }, [favorites, addFavorite, removeFavorite]);

        const isFavorite = useCallback(function (postId) {
            return favorites.some(function (fav) { return fav.id === postId; });
        }, [favorites]);

        const value = useMemo(function () {
            return {
                favorites: favorites,
                addFavorite: addFavorite,
                removeFavorite: removeFavorite,
                toggleFavorite: toggleFavorite,
                isFavorite: isFavorite
            };
        }, [favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite]);

        return React.createElement(FavoritesContext.Provider, { value: value }, props.children);
    };

    const useFavorites = function () { return useContext(FavoritesContext); };
    // @end:FavoritesContext

    // @section:PostsScreen-state @depends:[ThemeContext,FavoritesContext]
    const usePostsScreenState = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;
        const favoritesContext = useFavorites();

        const postsState = useState([]);
        const posts = postsState[0];
        const setPosts = postsState[1];

        const loadingState = useState(false);
        const loading = loadingState[0];
        const setLoading = loadingState[1];

        useEffect(function () {
            setLoading(true);
            fetch('https://fdut.edu.al/wp-json/wp/v2/posts')
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    const formattedPosts = data.map(function (post) {
                        return {
                            id: String(post.id),
                            title: post.title.rendered,
                            content: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
                            date: post.date.split('T')[0],
                            category: 'News',
                            url: post.link
                        };
                    });
                    setPosts(formattedPosts);
                    setLoading(false);
                })
                .catch(function (error) {
                    console.error('Error fetching posts:', error);
                    setLoading(false);
                });
        }, []);

        return {
            theme: theme,
            posts: posts,
            setPosts: setPosts,
            loading: loading,
            setLoading: setLoading,
            favorites: favoritesContext.favorites,
            toggleFavorite: favoritesContext.toggleFavorite,
            isFavorite: favoritesContext.isFavorite
        };
    };
    // @end:PostsScreen-state

    // @section:PostsScreen-PostCard @depends:[styles]
    const renderPostCard = function (post, isFavorite, onToggleFavorite, theme, onPostPress) {
        const isPostFavorite = isFavorite(post.id);

        return React.createElement(TouchableOpacity, {
            key: post.id,
            onPress: function () { onPostPress(post); },
            style: [styles.postCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }],
            componentId: 'post-card-' + post.id,
            activeOpacity: 0.7
        },
            React.createElement(View, { style: styles.postHeader, componentId: 'post-header-' + post.id },
                React.createElement(View, { style: styles.postTitleContainer, componentId: 'post-title-container-' + post.id },
                    React.createElement(Text, {
                        style: [styles.postTitle, { color: theme.colors.textPrimary }],
                        componentId: 'post-title-' + post.id
                    }, post.title),
                    React.createElement(Text, {
                        style: [styles.postCategory, { backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }],
                        componentId: 'post-category-' + post.id
                    }, post.category)
                ),
                React.createElement(TouchableOpacity, {
                    onPress: function (e) { e.stopPropagation(); onToggleFavorite(post); },
                    style: styles.favoriteButton,
                    componentId: 'favorite-button-' + post.id
                },
                    React.createElement(MaterialIcons, {
                        name: isPostFavorite ? 'favorite' : 'favorite-border',
                        size: 24,
                        color: isPostFavorite ? theme.colors.error : theme.colors.textSecondary
                    })
                )
            ),
            React.createElement(Text, {
                style: [styles.postContent, { color: theme.colors.textSecondary }],
                componentId: 'post-content-' + post.id,
                numberOfLines: 3
            }, post.content),
            React.createElement(Text, {
                style: [styles.postDate, { color: theme.colors.textSecondary }],
                componentId: 'post-date-' + post.id
            }, post.date),

        );
    };
    // @end:PostsScreen-PostCard

    // @section:PostsScreen @depends:[PostsScreen-state,PostsScreen-PostCard,styles]
    const PostsScreen = function () {
        const state = usePostsScreenState();
        const themeContext = useTheme();

        const handlePostPress = useCallback(function (post) {
            if (!post || !post.url) {
                Platform.OS === 'web'
                    ? window.alert('Post link is not available')
                    : Alert.alert('Error', 'Post link is not available');
                return;
            }

            if (Platform.OS === 'web') {
                window.open(post.url, '_blank', 'noopener,noreferrer');
                return;
            }

            Linking.openURL(post.url).catch(function (error) {
                console.error('Error opening post link:', error);
                Alert.alert('Error', 'Unable to open the post link');
            });
        }, []);

        return React.createElement(View, {
            style: [styles.container, { backgroundColor: state.theme.colors.background }],
            componentId: 'posts-screen'
        },
            React.createElement(View, { style: [styles.header, { borderBottomWidth: 1, borderBottomColor: state.theme.colors.border }], componentId: 'posts-header' },
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, componentId: 'posts-header-top' },
                    React.createElement(View, { style: { flex: 1 }, componentId: 'posts-header-text' },
                        React.createElement(Text, {
                            style: [styles.headerTitle, { color: state.theme.colors.textPrimary }],
                            componentId: 'posts-title'
                        }, 'FDUT Njoftime'),
                        React.createElement(Text, {
                            style: [styles.headerSubtitle, { color: state.theme.colors.textSecondary }],
                            componentId: 'posts-subtitle'
                        }, 'Njoftimet e fundit nga Fakulteti i Dretësisë')
                    ),
                    React.createElement(TouchableOpacity, {
                        onPress: themeContext.toggleDarkMode,
                        style: { padding: 8 },
                        componentId: 'posts-dark-mode-toggle'
                    },
                        React.createElement(MaterialIcons, {
                            name: themeContext.darkMode ? 'wb-sunny' : 'bedtime',
                            size: 24,
                            color: state.theme.colors.textPrimary
                        })
                    )
                )
            ),
            React.createElement(ScrollView, {
                style: styles.scrollView,
                contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
                componentId: 'posts-scroll'
            },
                state.posts.map(function (post) {
                    return renderPostCard(post, state.isFavorite, state.toggleFavorite, state.theme, handlePostPress);
                })
            )
        );
    };
    // @end:PostsScreen

    // @section:FavoritesScreen @depends:[ThemeContext,FavoritesContext,styles]
    const FavoritesScreen = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;
        const favoritesContext = useFavorites();

        return React.createElement(View, {
            style: [styles.container, { backgroundColor: theme.colors.background }],
            componentId: 'favorites-screen'
        },
            React.createElement(View, { style: [styles.header, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }], componentId: 'favorites-header' },
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, componentId: 'favorites-header-top' },
                    React.createElement(View, { style: { flex: 1 }, componentId: 'favorites-header-text' },
                        React.createElement(Text, {
                            style: [styles.headerTitle, { color: theme.colors.textPrimary }],
                            componentId: 'favorites-title'
                        }, 'Favorite Posts'),
                        React.createElement(Text, {
                            style: [styles.headerSubtitle, { color: theme.colors.textSecondary }],
                            componentId: 'favorites-subtitle'
                        }, 'Your saved posts (' + favoritesContext.favorites.length + ')')
                    ),
                    React.createElement(TouchableOpacity, {
                        onPress: themeContext.toggleDarkMode,
                        style: { padding: 8 },
                        componentId: 'favorites-dark-mode-toggle'
                    },
                        React.createElement(MaterialIcons, {
                            name: themeContext.darkMode ? 'wb_sunny' : 'bedtime',
                            size: 24,
                            color: theme.colors.textPrimary
                        })
                    )
                )
            ),
            favoritesContext.favorites.length === 0 ? React.createElement(View, {
                style: styles.emptyState,
                componentId: 'favorites-empty'
            },
                React.createElement(MaterialIcons, {
                    name: 'favorite-border',
                    size: 64,
                    color: theme.colors.textSecondary
                }),
                React.createElement(Text, {
                    style: [styles.emptyStateText, { color: theme.colors.textSecondary }],
                    componentId: 'favorites-empty-text'
                }, 'Nuk ka postime të preferuara'),
                React.createElement(Text, {
                    style: [styles.emptyStateSubtext, { color: theme.colors.textSecondary }],
                    componentId: 'favorites-empty-subtext'
                }, 'Filloni të shtoni postime nga skeda Njoftime për t’i parë këtu')
            ) : React.createElement(ScrollView, {
                style: styles.scrollView,
                contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
                componentId: 'favorites-scroll'
            },
                favoritesContext.favorites.map(function (post) {
                    return React.createElement(View, {
                        key: post.id,
                        style: [styles.postCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }],
                        componentId: 'favorite-card-' + post.id
                    },
                        React.createElement(View, { style: styles.postHeader, componentId: 'favorite-header-' + post.id },
                            React.createElement(View, { style: styles.postTitleContainer, componentId: 'favorite-title-container-' + post.id },
                                React.createElement(Text, {
                                    style: [styles.postTitle, { color: theme.colors.textPrimary }],
                                    componentId: 'favorite-title-' + post.id
                                }, post.title),
                                React.createElement(Text, {
                                    style: [styles.postCategory, { backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }],
                                    componentId: 'favorite-category-' + post.id
                                }, post.category)
                            ),
                            React.createElement(TouchableOpacity, {
                                onPress: function () { favoritesContext.removeFavorite(post.id); },
                                style: styles.favoriteButton,
                                componentId: 'remove-favorite-button-' + post.id
                            },
                                React.createElement(MaterialIcons, {
                                    name: 'delete',
                                    size: 24,
                                    color: theme.colors.error
                                })
                            )
                        ),
                        React.createElement(Text, {
                            style: [styles.postContent, { color: theme.colors.textSecondary }],
                            componentId: 'favorite-content-' + post.id
                        }, post.content),
                        React.createElement(Text, {
                            style: [styles.postDate, { color: theme.colors.textSecondary }],
                            componentId: 'favorite-date-' + post.id
                        }, post.date)
                    );
                })
            )
        );
    };
    // @end:FavoritesScreen

    // @section:ContactScreen-state @depends:[ThemeContext]
    const useContactScreenState = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;

        const nameState = useState('');
        const name = nameState[0];
        const setName = nameState[1];

        const emailState = useState('');
        const email = emailState[0];
        const setEmail = emailState[1];

        const subjectState = useState('');
        const subject = subjectState[0];
        const setSubject = subjectState[1];

        const messageState = useState('');
        const message = messageState[0];
        const setMessage = messageState[1];

        const submittingState = useState(false);
        const submitting = submittingState[0];
        const setSubmitting = submittingState[1];

        return {
            theme: theme,
            name: name, setName: setName,
            email: email, setEmail: setEmail,
            subject: subject, setSubject: setSubject,
            message: message, setMessage: setMessage,
            submitting: submitting, setSubmitting: setSubmitting
        };
    };
    // @end:ContactScreen-state

    // @section:ContactScreen-handlers @depends:[ContactScreen-state]
    const contactRecipientEmail = 'tender3@tonertaxi.info';

    const contactScreenHandlers = {
        submitForm: function (state) {
            if (!state.name.trim() || !state.email.trim() || !state.subject.trim() || !state.message.trim()) {
                Platform.OS === 'web' ? window.alert('Ju lutem plotësoni të gjitha fushat') : Alert.alert('Error', 'Ju lutem plotësoni të gjitha fushat');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(state.email)) {
                Platform.OS === 'web' ? window.alert('Ju lutem vendosni një adresë email të vlefshme') : Alert.alert('Error', 'Ju lutem vendosni një adresë email të vlefshme');
                return;
            }

            const subject = state.subject.trim();
            const body = [
                'Name: ' + state.name.trim(),
                'Email: ' + state.email.trim(),
                '',
                state.message.trim()
            ].join('\n');
            const mailtoUrl = 'mailto:' + contactRecipientEmail
                + '?subject=' + encodeURIComponent(subject)
                + '&body=' + encodeURIComponent(body);

            state.setSubmitting(true);

            const handleSuccess = function () {
                state.setSubmitting(false);
                state.setName('');
                state.setEmail('');
                state.setSubject('');
                state.setMessage('');
                Platform.OS === 'web'
                    ? window.alert('Aplikacioni juaj i email-it është hapur. Mesazhi është adresuar te ' + contactRecipientEmail + '.')
                    : Alert.alert('Success', 'Aplikacioni juaj i email-it është hapur. Mesazhi është adresuar te ' + contactRecipientEmail + '.');
            };

            const handleFailure = function (error) {
                console.error('Error opening mail app:', error);
                state.setSubmitting(false);
                Platform.OS === 'web'
                    ? window.alert('Nuk mund të hapet aplikacioni i email-it. Ju lutem dërgoni mesazhin tuaj manualisht te ' + contactRecipientEmail + '.')
                    : Alert.alert('Error', 'Nuk mund të hapet aplikacioni i email-it. Ju lutem dërgoni mesazhin tuaj manualisht te ' + contactRecipientEmail + '.');
            };

            if (Platform.OS === 'web') {
                try {
                    window.location.href = mailtoUrl;
                    handleSuccess();
                } catch (error) {
                    handleFailure(error);
                }
                return;
            }

            Linking.canOpenURL(mailtoUrl)
                .then(function (supported) {
                    if (!supported) {
                        throw new Error('Nuk ka një aplikacion email-i të disponueshëm');
                    }
                    return Linking.openURL(mailtoUrl);
                })
                .then(function () {
                    handleSuccess();
                })
                .catch(function (error) {
                    handleFailure(error);
                });
        }
    };

    const WebsiteScreen = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;
        const loadingState = useState(true);
        const loading = loadingState[0];
        const setLoading = loadingState[1];

        return React.createElement(View, {
            style: [styles.container, { backgroundColor: theme.colors.background }],
            componentId: 'website-screen'
        },
            Platform.OS === 'web' ? React.createElement(View, {
                style: { flex: 1, alignItems: 'center', justifyContent: 'center' },
                componentId: 'website-webview-unavailable'
            },
                React.createElement(Text, {
                    style: [styles.headerTitle, { color: theme.colors.textPrimary }],
                    componentId: 'website-unavailable-text'
                }, 'WebView not available on web'),
                React.createElement(TouchableOpacity, {
                    onPress: function () { window.open('https://fdut.edu.al', '_blank'); },
                    style: [styles.submitButton, { backgroundColor: theme.colors.primary }],
                    componentId: 'website-open-button'
                },
                    React.createElement(Text, {
                        style: styles.submitButtonText,
                        componentId: 'website-open-text'
                    }, 'Open in browser')
                )
            ) : React.createElement(View, { style: { flex: 1 }, componentId: 'website-webview-container' },
                loading ? React.createElement(View, {
                    style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
                    componentId: 'website-loading'
                },
                    React.createElement(ActivityIndicator, {
                        size: 'large',
                        color: theme.colors.primary,
                        componentId: 'website-loading-indicator'
                    })
                ) : null,
                React.createElement(WebView, {
                    source: { uri: 'https://fdut.edu.al' },
                    onLoadStart: function () { setLoading(true); },
                    onLoadEnd: function () { setLoading(false); },
                    style: { flex: 1 },
                    componentId: 'website-webview'
                })
            )
        );
    };
    // @end:ContactScreen-handlers

    // @section:ContactScreen @depends:[ContactScreen-state,ContactScreen-handlers,styles]
    const ContactScreen = function () {
        const state = useContactScreenState();
        const handlers = contactScreenHandlers;
        const themeContext = useTheme();

        return React.createElement(View, {
            style: [styles.container, { backgroundColor: state.theme.colors.background }],
            componentId: 'contact-screen'
        },
            React.createElement(View, { style: [styles.header, { borderBottomWidth: 1, borderBottomColor: state.theme.colors.border }], componentId: 'contact-header' },
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, componentId: 'contact-header-top' },
                    React.createElement(View, { style: { flex: 1 }, componentId: 'contact-header-text' },
                        React.createElement(Text, {
                            style: [styles.headerTitle, { color: state.theme.colors.textPrimary }],
                            componentId: 'contact-title'
                        }, 'Contact Us'),
                        React.createElement(Text, {
                            style: [styles.headerSubtitle, { color: state.theme.colors.textSecondary }],
                            componentId: 'contact-subtitle'
                        }, 'Get in touch with FDUT')
                    ),
                    React.createElement(TouchableOpacity, {
                        onPress: themeContext.toggleDarkMode,
                        style: { padding: 8 },
                        componentId: 'contact-dark-mode-toggle'
                    },
                        React.createElement(MaterialIcons, {
                            name: themeContext.darkMode ? 'sunny' : 'bedtime',
                            size: 24,
                            color: state.theme.colors.textPrimary
                        })
                    )
                )
            ),
            React.createElement(ScrollView, {
                style: styles.scrollView,
                contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
                componentId: 'contact-scroll'
            },
                React.createElement(View, {
                    style: [styles.formCard, { backgroundColor: state.theme.colors.card, borderColor: state.theme.colors.border }],
                    componentId: 'contact-form-card'
                },
                    React.createElement(View, { style: styles.universityInfo, componentId: 'university-info' },
                        React.createElement(Text, {
                            style: [styles.universityName, { color: state.theme.colors.primary }],
                            componentId: 'university-name'
                        }, 'Fakulteti i Drejtësisë'),
                        React.createElement(Text, {
                            style: [styles.universityWebsite, { color: state.theme.colors.textSecondary }],
                            componentId: 'university-website'
                        }, 'fdut.edu.al')
                    ),

                    React.createElement(Text, {
                        style: [styles.formLabel, { color: state.theme.colors.textPrimary }],
                        componentId: 'contact-name-label'
                    }, 'Emri i plotë *'),
                    React.createElement(TextInput, {
                        style: [styles.textInput, { backgroundColor: state.theme.colors.background, borderColor: state.theme.colors.border, color: state.theme.colors.textPrimary }],
                        value: state.name,
                        onChangeText: state.setName,
                        placeholder: 'Shkruani emrin tuaj të plotë',
                        placeholderTextColor: state.theme.colors.textSecondary,
                        componentId: 'contact-name-input'
                    }),

                    React.createElement(Text, {
                        style: [styles.formLabel, { color: state.theme.colors.textPrimary }],
                        componentId: 'contact-email-label'
                    }, 'Adresa e Email-it *'),
                    React.createElement(TextInput, {
                        style: [styles.textInput, { backgroundColor: state.theme.colors.background, borderColor: state.theme.colors.border, color: state.theme.colors.textPrimary }],
                        value: state.email,
                        onChangeText: state.setEmail,
                        placeholder: 'Shkruani adresën tuaj të email-it',
                        placeholderTextColor: state.theme.colors.textSecondary,
                        keyboardType: 'email-address',
                        autoCapitalize: 'none',
                        componentId: 'contact-email-input'
                    }),

                    React.createElement(Text, {
                        style: [styles.formLabel, { color: state.theme.colors.textPrimary }],
                        componentId: 'contact-subject-label'
                    }, 'Subjekti *'),
                    React.createElement(TextInput, {
                        style: [styles.textInput, { backgroundColor: state.theme.colors.background, borderColor: state.theme.colors.border, color: state.theme.colors.textPrimary }],
                        value: state.subject,
                        onChangeText: state.setSubject,
                        placeholder: 'Shkruani subjektin e mesazhit',
                        placeholderTextColor: state.theme.colors.textSecondary,
                        componentId: 'contact-subject-input'
                    }),

                    React.createElement(Text, {
                        style: [styles.formLabel, { color: state.theme.colors.textPrimary }],
                        componentId: 'contact-message-label'
                    }, 'Mesazhi *'),
                    React.createElement(TextInput, {
                        style: [styles.textAreaInput, { backgroundColor: state.theme.colors.background, borderColor: state.theme.colors.border, color: state.theme.colors.textPrimary }],
                        value: state.message,
                        onChangeText: state.setMessage,
                        placeholder: 'Shkruani mesazhin tuaj',
                        placeholderTextColor: state.theme.colors.textSecondary,
                        multiline: true,
                        numberOfLines: 6,
                        textAlignVertical: 'top',
                        componentId: 'contact-message-input'
                    }),

                    React.createElement(TouchableOpacity, {
                        style: [styles.submitButton, { backgroundColor: state.theme.colors.primary, opacity: state.submitting ? 0.7 : 1 }],
                        onPress: function () { handlers.submitForm(state); },
                        disabled: state.submitting,
                        componentId: 'contact-submit-button'
                    },
                        state.submitting ? React.createElement(ActivityIndicator, {
                            size: 'small',
                            color: '#FFFFFF',
                            componentId: 'contact-submit-loading'
                        }) : React.createElement(Text, {
                            style: styles.submitButtonText,
                            componentId: 'contact-submit-text'
                        }, 'Dërgo Mesazhin')
                    )
                )
            )
        );
    };
    // @end:ContactScreen

    // @section:SplashScreen @depends:[styles]
    const SplashScreen = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;

        return React.createElement(View, {
            style: [styles.splashContainer, { backgroundColor: theme.colors.background }],
            componentId: 'splash-screen'
        },
            React.createElement(View, {
                style: styles.splashContent,
                componentId: 'splash-content'
            },
                React.createElement(Image, {
                    source: require('./logo.png'),
                    style: styles.splashLogo,
                    resizeMode: 'contain',
                    componentId: 'splash-logo'
                }),
                React.createElement(Text, {
                    style: [styles.splashTitle, { color: theme.colors.textPrimary }],
                    componentId: 'splash-title'
                }, 'FDUT'),
                React.createElement(Text, {
                    style: [styles.splashSubtitle, { color: theme.colors.textSecondary }],
                    componentId: 'splash-subtitle'
                }, 'Fakulteti i Drejtësisë')
            )
        );
    };
    // @end:SplashScreen

    // @section:TabNavigator @depends:[PostsScreen,FavoritesScreen,ContactScreen,navigation-setup]
    const TabNavigator = function () {
        const themeContext = useTheme();
        const theme = themeContext.theme;

        return React.createElement(Tab.Navigator, {
            screenOptions: function (props) {
                return {
                    tabBarActiveTintColor: theme.colors.primary,
                    tabBarInactiveTintColor: theme.colors.textSecondary,
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 0,
                        backgroundColor: theme.colors.card,
                        borderTopColor: theme.colors.border,
                        height: Platform.OS === 'web' ? 60 : 80,
                        paddingBottom: Platform.OS === 'web' ? 8 : 20
                    },
                    headerShown: false
                };
            }
        },
            React.createElement(Tab.Screen, {
                name: 'Njoftime',
                component: PostsScreen,
                options: {
                    tabBarIcon: function (props) {
                        return React.createElement(MaterialIcons, {
                            name: 'article',
                            size: 24,
                            color: props.color
                        });
                    }
                }
            }),
            React.createElement(Tab.Screen, {
                name: 'Të Preferuarat',
                component: FavoritesScreen,
                options: {
                    tabBarIcon: function (props) {
                        return React.createElement(MaterialIcons, {
                            name: 'favorite',
                            size: 24,
                            color: props.color
                        });
                    }
                }
            }),
            React.createElement(Tab.Screen, {
                name: 'Kontakt',
                component: ContactScreen,
                options: {
                    tabBarIcon: function (props) {
                        return React.createElement(MaterialIcons, {
                            name: 'contact-mail',
                            size: 24,
                            color: props.color
                        });
                    }
                }
            }),
            React.createElement(Tab.Screen, {
                name: 'Website',
                component: WebsiteScreen,
                options: {
                    tabBarIcon: function (props) {
                        return React.createElement(MaterialIcons, {
                            name: 'language',
                            size: 24,
                            color: props.color
                        });
                    }
                }
            })
        );
    };
    // @end:TabNavigator

    // @section:styles @depends:[theme]
    const styles = StyleSheet.create({
        container: {
            flex: 1
        },
        header: {
            paddingTop: Platform.OS === 'web' ? 20 : 50,
            paddingHorizontal: 20,
            paddingBottom: 20
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 4
        },
        headerSubtitle: {
            fontSize: 16
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 20
        },
        postCard: {
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            boxShadow: Platform.OS === 'web' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : undefined,
            shadowColor: Platform.OS !== 'web' ? '#000' : undefined,
            shadowOffset: Platform.OS !== 'web' ? { width: 0, height: 2 } : undefined,
            shadowOpacity: Platform.OS !== 'web' ? 0.1 : undefined,
            shadowRadius: Platform.OS !== 'web' ? 8 : undefined,
            elevation: Platform.OS !== 'web' ? 3 : undefined
        },
        postHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12
        },
        postTitleContainer: {
            flex: 1,
            marginRight: 12
        },
        postTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 6
        },
        postCategory: {
            fontSize: 12,
            fontWeight: '600',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            alignSelf: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: 0.5
        },
        postContent: {
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 12
        },
        postDate: {
            fontSize: 12,
            fontStyle: 'italic'
        },
        postLink: {
            marginTop: 8,
            fontSize: 13,
            fontWeight: '600'
        },
        favoriteButton: {
            padding: 8,
            borderRadius: 8
        },
        emptyState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60
        },
        emptyStateText: {
            fontSize: 18,
            fontWeight: '600',
            marginTop: 16,
            marginBottom: 8
        },
        emptyStateSubtext: {
            fontSize: 14,
            textAlign: 'center',
            paddingHorizontal: 40
        },
        formCard: {
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            boxShadow: Platform.OS === 'web' ? '0 2px 8px rgba(0, 0, 0, 0.1)' : undefined,
            shadowColor: Platform.OS !== 'web' ? '#000' : undefined,
            shadowOffset: Platform.OS !== 'web' ? { width: 0, height: 2 } : undefined,
            shadowOpacity: Platform.OS !== 'web' ? 0.1 : undefined,
            shadowRadius: Platform.OS !== 'web' ? 8 : undefined,
            elevation: Platform.OS !== 'web' ? 3 : undefined
        },
        universityInfo: {
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB'
        },
        universityName: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 4
        },
        universityWebsite: {
            fontSize: 14,
            fontStyle: 'italic'
        },
        formLabel: {
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
            marginTop: 16
        },
        textInput: {
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16
        },
        textAreaInput: {
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            minHeight: 120
        },
        submitButton: {
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 24,
            boxShadow: Platform.OS === 'web' ? '0 4px 8px rgba(0, 0, 0, 0.15)' : undefined,
            shadowColor: Platform.OS !== 'web' ? '#000' : undefined,
            shadowOffset: Platform.OS !== 'web' ? { width: 0, height: 4 } : undefined,
            shadowOpacity: Platform.OS !== 'web' ? 0.15 : undefined,
            shadowRadius: Platform.OS !== 'web' ? 8 : undefined,
            elevation: Platform.OS !== 'web' ? 4 : undefined
        },
        submitButtonText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold'
        },
        splashContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
        },
        splashContent: {
            alignItems: 'center',
            justifyContent: 'center'
        },
        splashLogo: {
            width: 150,
            height: 150,
            marginBottom: 20,
            borderRadius: 20
        },
        splashTitle: {
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 8,
            textAlign: 'center'
        },
        splashSubtitle: {
            fontSize: 16,
            textAlign: 'center',
            paddingHorizontal: 20
        }
    });
    // @end:styles

    // @section:return @depends:[ThemeProvider,FavoritesProvider,TabNavigator,SplashScreen]
    const PostDetailScreen = function ({ route, navigation }) {
        const themeContext = useTheme();
        const theme = themeContext.theme;
        const favoritesContext = useFavorites();
        const post = route.params.post;
        const isPostFavorite = favoritesContext.isFavorite(post.id);

        return React.createElement(View, {
            style: [styles.container, { backgroundColor: theme.colors.background }],
            componentId: 'post-detail-screen'
        },
            React.createElement(View, { style: [styles.header, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }], componentId: 'post-detail-header' },
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, componentId: 'post-detail-header-top' },
                    React.createElement(TouchableOpacity, {
                        onPress: function () { navigation.goBack(); },
                        style: { padding: 8 },
                        componentId: 'post-detail-back-button'
                    },
                        React.createElement(MaterialIcons, {
                            name: 'arrow-back',
                            size: 24,
                            color: theme.colors.textPrimary
                        })
                    ),
                    React.createElement(View, { style: { flex: 1 }, componentId: 'post-detail-header-text' },
                        React.createElement(Text, {
                            style: [styles.headerTitle, { color: theme.colors.textPrimary, marginLeft: 8 }],
                            componentId: 'post-detail-title'
                        }, 'Post Details')
                    ),
                    React.createElement(TouchableOpacity, {
                        onPress: function () { favoritesContext.toggleFavorite(post); },
                        style: { padding: 8 },
                        componentId: 'post-detail-favorite-button'
                    },
                        React.createElement(MaterialIcons, {
                            name: isPostFavorite ? 'favorite' : 'favorite-border',
                            size: 24,
                            color: isPostFavorite ? theme.colors.error : theme.colors.textSecondary
                        })
                    )
                )
            ),
            React.createElement(ScrollView, {
                style: styles.scrollView,
                contentContainerStyle: { paddingBottom: Platform.OS === 'web' ? 90 : 100 },
                componentId: 'post-detail-scroll'
            },
                React.createElement(View, {
                    style: [styles.postCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }],
                    componentId: 'post-detail-card'
                },
                    React.createElement(Text, {
                        style: [styles.postTitle, { color: theme.colors.textPrimary, fontSize: 24 }],
                        componentId: 'post-detail-post-title'
                    }, post.title),
                    React.createElement(Text, {
                        style: [styles.postCategory, { backgroundColor: theme.colors.primary + '20', color: theme.colors.primary, marginTop: 12 }],
                        componentId: 'post-detail-post-category'
                    }, post.category),
                    React.createElement(Text, {
                        style: [styles.postDate, { color: theme.colors.textSecondary, marginTop: 12 }],
                        componentId: 'post-detail-post-date'
                    }, post.date),
                    React.createElement(View, { style: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16 }, componentId: 'post-detail-divider' }),
                    React.createElement(Text, {
                        style: [styles.postContent, { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 }],
                        componentId: 'post-detail-post-content'
                    }, post.content)
                )
            )
        );
    };

    const splashState = useState(true);
    const showSplash = splashState[0];
    const setShowSplash = splashState[1];

    useEffect(function () {
        const timer = setTimeout(function () {
            setShowSplash(false);
        }, 2000);

        return function () { clearTimeout(timer); };
    }, []);

    return React.createElement(ThemeProvider, null,
        React.createElement(FavoritesProvider, null,
            React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' } },
                React.createElement(StatusBar, { barStyle: 'dark-content' }),
                showSplash ? React.createElement(SplashScreen) : React.createElement(TabNavigator)
            )
        )
    );
    // @end:return

};

export default HomeScreen;
