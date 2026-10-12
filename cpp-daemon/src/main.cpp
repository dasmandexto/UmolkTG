#include <iostream>
#include <string>
#include <memory>
#include <thread>
#include <chrono>
#include "tdata_loader.hpp"
#include "tg_voip_engine.hpp"
#include "rvc_gpu_client.hpp"

int main(int argc, char* argv[]) {
    std::string tdata_path = "./tdata";
    std::string vast_rvc_url = "ws://vast-ai-instance:38291/rvc";

    if (argc > 1) {
        tdata_path = argv[1];
    }

    std::cout << "========================================================" << std::endl;
    std::cout << "    UmolkTG Pro — Headless C++ VoIP & RVC Daemon v1.2   " << std::endl;
    std::cout << "  Engine: Telegram Desktop tgcalls + Vast.ai GPU Voice  " << std::endl;
    std::cout << "========================================================" << std::endl;

    // 1. Load TData session
    TDataSession session = TDataLoader::loadFromFolder(tdata_path);

    // 2. Initialize RVC GPU Client
    auto rvc = std::make_shared<RvcGpuClient>();
    RvcSettings rvc_settings;
    rvc_settings.server_url = vast_rvc_url;
    rvc_settings.model = "Female_Operator_v2.pth";
    rvc_settings.pitch_shift = 12; // female voice shift
    rvc->configure(rvc_settings);
    rvc->connect();

    // 3. Initialize Telegram VoIP Engine
    TgVoipEngine voip;
    voip.initialize(session);
    voip.setRvcClient(rvc);

    std::cout << "[Daemon] Listening on ws://127.0.0.1:8765 for Web UI control." << std::endl;
    std::cout << "[Daemon] Ready for headless calls without Qt GUI overhead." << std::endl;

    // Keep running daemon loop
    while (true) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }

    return 0;
}
