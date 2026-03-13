import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, CommunityMessage } from '../types';
import { API_BASE_URL } from '../services/config';
import { io, Socket } from 'socket.io-client';

interface CommunityChatProps {
    userProfile: UserProfile;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ userProfile }) => {
    const [messages, setMessages] = useState<CommunityMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const token = localStorage.getItem('nutrican_token');
        
        // Fetch initial history
        fetch(`${API_BASE_URL}/api/chat/history`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setMessages(data);
            }
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        })
        .catch(err => {
            console.error('Failed to load chat history:', err);
            setLoading(false);
        });

        // Initialize socket connection (allowing default polling fallback)
        const newSocket = io(API_BASE_URL, {
            auth: { token }
        });

        // Fallback robust polling every 10 seconds just in case the socket connection completely drops or fails proxying
        const pollInterval = setInterval(() => {
            fetch(`${API_BASE_URL}/api/chat/history`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setMessages(prev => {
                        // Check if we need to update state to prevent unnecessary re-renders
                        if (prev.length === 0 || 
                            data.length !== prev.length || 
                            data[data.length-1]?._id !== prev[prev.length-1]?._id ||
                            JSON.stringify(data.map(m => m.likes)) !== JSON.stringify(prev.map(m => m.likes))) {
                            return data;
                        }
                        return prev;
                    });
                }
            })
            .catch(console.error);
        }, 10000);

        newSocket.on('receiveMessage', (msg: CommunityMessage) => {
            setMessages(prev => {
                if (prev.some(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
            setTimeout(scrollToBottom, 100);
        });

        newSocket.on('messageLiked', ({ messageId, likes }: { messageId: string, likes: string[] }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, likes } : m));
        });

        setSocket(newSocket);

        return () => {
            clearInterval(pollInterval);
            newSocket.disconnect();
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const textToSend = newMessage.trim();
        if (!textToSend) return;

        const payload = {
            text: textToSend,
            senderName: userProfile.name,
            senderId: userProfile.email || userProfile.name,
            replyTo: replyTo?._id || null
        };
        
        // Optimistically clear input
        setNewMessage('');
        setReplyTo(null);

        try {
            const token = localStorage.getItem('nutrican_token');
            const res = await fetch(`${API_BASE_URL}/api/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedMsg = await res.json();
                setMessages(prev => {
                    if (prev.some(m => m._id === savedMsg._id)) return prev;
                    return [...prev, savedMsg];
                });
                setTimeout(scrollToBottom, 100);
            } else {
                console.error('Failed to send message via API');
            }
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    const handleLike = async (messageId: string) => {
        try {
            const token = localStorage.getItem('nutrican_token');
            const res = await fetch(`${API_BASE_URL}/api/chat/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId,
                    userId: userProfile.email || userProfile.name
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, likes: data.likes } : m));
            }
        } catch (err) {
            console.error('Error liking message:', err);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] p-4 page-transition relative">
            <h2 className="text-3xl font-black text-emerald-950 dark:text-white mb-2 tracking-tighter">NutriCan Chat</h2>
            <p className="text-gray-500 mb-4 font-bold text-sm">Real-time community support.</p>
            
            <div className="flex-1 overflow-y-auto bg-white/40 dark:bg-emerald-950/40 backdrop-blur-md rounded-3xl p-4 mb-4 shadow-inner border border-white/20 flex flex-col gap-3 pb-20 no-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500 my-auto font-medium">No messages yet. Be the first to say hi!</p>
                ) : (
                    messages.map((msg, index) => {
                        const myId = userProfile.email || userProfile.name;
                        const isMe = msg.senderId === myId;
                        const hasLiked = msg.likes?.includes(myId);

                        return (
                            <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in-up`}>
                                <div className={`relative max-w-[85%] rounded-2xl p-3 shadow-md ${isMe ? 'bg-brand-green text-white rounded-tr-sm' : 'bg-white dark:bg-emerald-900/80 text-emerald-950 dark:text-white rounded-tl-sm'}`}>
                                    {!isMe && <p className="text-[10px] font-black opacity-60 mb-1">{msg.senderName}</p>}
                                    
                                    {msg.replyTo && (
                                        <div className={`text-xs p-2 rounded-xl mb-2 border-l-2 ${isMe ? 'bg-white/20 border-white/40' : 'bg-emerald-50/50 dark:bg-emerald-800/50 border-emerald-500/30'} opacity-90`}>
                                            <p className="font-bold flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                {msg.replyTo.senderName}
                                            </p>
                                            <p className="truncate line-clamp-1">{msg.replyTo.text}</p>
                                        </div>
                                    )}
                                    
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    
                                    <div className={`mt-1 flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <button onClick={() => handleLike(msg._id)} className={`flex items-center gap-1 transition-transform active:scale-95 ${hasLiked ? 'text-red-400' : 'hover:opacity-80'}`}>
                                            <svg className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {msg.likes?.length > 0 && <span>{msg.likes.length}</span>}
                                        </button>
                                        {!isMe && (
                                            <button onClick={() => setReplyTo(msg)} className="hover:opacity-80">Reply</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="absolute bottom-[calc(5rem+10px)] sm:bottom-4 left-4 right-4 animate-fade-in-up z-20">
                <form onSubmit={handleSendMessage} className="glass-panel p-2 rounded-[2rem] shadow-xl flex flex-col border border-white/40 dark:border-emerald-500/20 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-xl">
                    {replyTo && (
                        <div className="px-4 py-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2 truncate">
                                <svg className="w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                <span className="font-bold">Replying to {replyTo.senderName}:</span>
                                <span className="truncate max-w-[120px] italic">{replyTo.text}</span>
                            </div>
                            <button type="button" onClick={() => setReplyTo(null)} className="p-1 hover:text-red-500 font-bold">✕</button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent px-4 py-3 outline-none text-emerald-950 dark:text-white placeholder-gray-400 font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-transform active:scale-95 shadow-glow-primary mr-1"
                        >
                            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommunityChat;
