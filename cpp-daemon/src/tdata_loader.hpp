#pragma once
#include <string>
#include <vector>
#include <cstdint>

struct TDataSession {
    std::string phone;
    uint32_t dc_id = 2;
    std::string server_ip = "149.154.167.50";
    uint16_t server_port = 443;
    std::vector<uint8_t> auth_key; // 256 bytes
    std::string device_model = "Telegram Desktop 4.16.8";
    std::string app_version = "4.16.8";
    bool valid = false;
};

class TDataLoader {
public:
    static TDataSession loadFromFolder(const std::string& tdata_path);
    static bool decryptLocalKey(const std::vector<uint8_t>& key_data, std::vector<uint8_t>& out_key);
};
