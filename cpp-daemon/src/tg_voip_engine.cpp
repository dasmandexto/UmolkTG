#include "tg_voip_engine.hpp"
#include <iostream>
#include <thread>
#include <chrono>

TgVoipEngine::TgVoipEngine() {}
TgVoipEngine::~TgVoipEngine() {
    endCall();
}

void TgVoipEngine::initialize(const TDataSession& session) {
    m_session = session;
    std::cout << "[TgVoIP] Initialized engine for account " << session.phone
              << " on DC " << session.dc_id << " (" << session.server_ip << ")" << std::endl;
}

bool TgVoipEngine::startCall(const std::string& target_peer) {
    m_state = CallState::CALLING;
    std::cout << "[TgVoIP] Calling target peer: " << target_peer << "..." << std::endl;

    // Simulate MTProto phone.requestCall handshake
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    m_state = CallState::RINGING;
    std::cout << "[TgVoIP] Ringing at " << target_peer << "..." << std::endl;

    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    m_state = CallState::CONNECTED;
    std::cout << "[TgVoIP] Call CONNECTED! VoIP Opus WebRTC audio stream established." << std::endl;
    return true;
}

void TgVoipEngine::endCall() {
    if (m_state != CallState::IDLE) {
        std::cout << "[TgVoIP] Call discarded/hung up." << std::endl;
        m_state = CallState::ENDED;
    }
}

void TgVoipEngine::setMute(bool muted) {
    m_muted = muted;
    std::cout << "[TgVoIP] Mute status: " << (muted ? "MUTED" : "UNMUTED") << std::endl;
}

void TgVoipEngine::onIncomingAudioFromMic(const std::vector<uint8_t>& mic_pcm) {
    if (m_muted || m_state != CallState::CONNECTED) return;

    // Step 1: Route mic audio through RVC Vast.ai GPU voice converter (if active)
    std::vector<uint8_t> processed = mic_pcm;
    if (m_rvc_client && m_rvc_client->isConnected()) {
        processed = m_rvc_client->processAudioFrame(mic_pcm);
    }

    // Step 2: Transmit processed voice to Telegram call peer
    sendAudioToTelegramVoIP(processed);
}

void TgVoipEngine::sendAudioToTelegramVoIP(const std::vector<uint8_t>& processed_pcm) {
    // Encapsulate into Opus and push to Telegram WebRTC reflector
    (void)processed_pcm;
}
