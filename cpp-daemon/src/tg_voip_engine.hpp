#pragma once
#include <string>
#include <memory>
#include "tdata_loader.hpp"
#include "rvc_gpu_client.hpp"

enum class CallState {
    IDLE,
    CALLING,
    RINGING,
    CONNECTED,
    ENDED
};

class TgVoipEngine {
public:
    TgVoipEngine();
    ~TgVoipEngine();

    void initialize(const TDataSession& session);
    bool startCall(const std::string& target_peer);
    void endCall();
    void setMute(bool muted);

    CallState getState() const { return m_state; }
    void setRvcClient(std::shared_ptr<RvcGpuClient> rvc) { m_rvc_client = rvc; }

    void onIncomingAudioFromMic(const std::vector<uint8_t>& mic_pcm);
    void sendAudioToTelegramVoIP(const std::vector<uint8_t>& processed_pcm);

private:
    TDataSession m_session;
    CallState m_state = CallState::IDLE;
    bool m_muted = false;
    std::shared_ptr<RvcGpuClient> m_rvc_client;
};
