import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
} from 'react-native-agora';
import auth from '@react-native-firebase/auth';


const AGORA_APP_ID = '219d7f7a6ea14fdf942d3cbfc95102ca';

const LivestreamScreen = ({ route }: any) => {
  const { communityId, communityName, isAdmin } = route.params;
  const engineRef = useRef<RtcEngine | null>(null);

  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const channelName = `community_${communityId}`;
  const uid = Math.floor(Math.random() * 100000);

  const initAgora = async () => {
    const engine = await RtcEngine.create(AGORA_APP_ID);
    engineRef.current = engine;

    await engine.enableVideo();
    await engine.setChannelProfile(1); // live broadcasting
    await engine.setClientRole(isAdmin ? 1 : 2); // 1 = host, 2 = audience

    engine.addListener('UserJoined', (uid) => {
      setRemoteUid(uid);
    });

    engine.addListener('UserOffline', () => {
      setRemoteUid(null);
    });

    // 🔐 In production, fetch token from Firebase Function
    await engine.joinChannel(null, channelName, null, uid);

    setJoined(true);
  };

  const leaveStream = async () => {
    await engineRef.current?.leaveChannel();
    engineRef.current?.destroy();
    engineRef.current = null;
    setJoined(false);
    setRemoteUid(null);
  };

  useEffect(() => {
    return () => {
      leaveStream();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{communityName} Livestream</Text>

      {!joined && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={initAgora}
        >
          <Text style={styles.startButtonText}>
            {isAdmin ? 'Start Livestream' : 'Join Livestream'}
          </Text>
        </TouchableOpacity>
      )}

      {joined && (
        <View style={styles.videoContainer}>
          {isAdmin && (
            <RtcLocalView.SurfaceView
              style={styles.video}
              channelId={channelName}
              renderMode={VideoRenderMode.Hidden}
            />
          )}

          {!isAdmin && remoteUid && (
            <RtcRemoteView.SurfaceView
              style={styles.video}
              uid={remoteUid}
              channelId={channelName}
              renderMode={VideoRenderMode.Hidden}
            />
          )}

          {!isAdmin && !remoteUid && (
            <Text style={styles.waitingText}>Waiting for host to go live…</Text>
          )}

          <TouchableOpacity
            style={styles.endButton}
            onPress={leaveStream}
          >
            <Text style={styles.endButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LivestreamScreen;
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: '#fff',
      fontSize: 18,
      marginBottom: 20,
    },
    startButton: {
      backgroundColor: '#ff4757',
      paddingHorizontal: 30,
      paddingVertical: 14,
      borderRadius: 10,
    },
    startButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    videoContainer: {
      flex: 1,
      width: '100%',
    },
    video: {
      flex: 1,
    },
    waitingText: {
      color: '#ccc',
      textAlign: 'center',
      marginTop: 20,
    },
    endButton: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      backgroundColor: '#ff4757',
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
    },
    endButtonText: {
      color: '#fff',
      fontSize: 16,
    },
  });
  