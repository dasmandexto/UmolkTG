FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libssl-dev \
    git \
    pkg-config \
    libopus-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN mkdir -p build && cd build && cmake .. && make -j$(nproc)

EXPOSE 8765

CMD ["./build/umolktg_voip_daemon"]
