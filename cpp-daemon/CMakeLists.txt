cmake_minimum_required(VERSION 3.20)
project(umolktg_voip_daemon CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Optimization flags for real-time audio processing
add_compile_options(-O3 -Wall -Wextra -pthread)

# Find system libraries
find_package(OpenSSL REQUIRED)
find_package(Threads REQUIRED)

# Include paths
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${OPENSSL_INCLUDE_DIR}
)

# Source files
set(SOURCES
    src/main.cpp
    src/tdata_loader.cpp
    src/tg_voip_engine.cpp
    src/rvc_gpu_client.cpp
)

# Executable
add_executable(umolktg_voip_daemon ${SOURCES})

# Target link libraries
target_link_libraries(umolktg_voip_daemon
    PRIVATE
    OpenSSL::SSL
    OpenSSL::Crypto
    Threads::Threads
)

message(STATUS "UmolkTG C++ Headless VoIP Daemon configured successfully!")
