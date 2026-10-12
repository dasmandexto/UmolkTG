#pragma once
#include <string>
#include <vector>
#include <functional>

struct RvcSettings {
    bool enabled = true;
    std::string server_url = "ws://vast-ai-instance:38291/rvc";
    std::string model = "Female_Operator_v2.pth";
    int pitch_shift = 0; // -12 to +12 semitones
    std::string f0_method = "rmvpe";
    float index_rate = 0.75f;
    int buffer_size_ms = 128;
};

class RvcGpuClient {
public:
    RvcGpuClient();
    ~RvcGpuClient();

    void configure(const RvcSettings& settings);
    bool connect();
    void disconnect();

    // Process audio buffer through Vast.ai GPU and return converted voice
    std::vector<uint8_t> processAudioFrame(const std::vector<uint8_t>& pcm_input_frame);

    bool isConnected() const { return m_connected; }
    int getGpuLatencyMs() const { return m_gpu_latency_ms; }

private:
    RvcSettings m_settings;
    bool m_connected = false;
    int m_gpu_latency_ms = 35;
};
