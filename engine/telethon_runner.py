#!/usr/bin/env python3
"""
UmolkTG — Standalone Python MTProto Runner (Telethon / Pyrogram)
Підходить для автономного запуску завдань на сервері безпосередньо через термінал або cron.

Використання:
    python3 engine/telethon_runner.py --help
    python3 engine/telethon_runner.py check --session sessions/my_account.session
    python3 engine/telethon_runner.py parse --session sessions/my_account.session --chat @crypto_chat --limit 200
    python3 engine/telethon_runner.py send --session sessions/my_account.session --target @username --text "Привіт!"
"""

import sys
import os
import argparse
import asyncio

try:
    from telethon import TelegramClient, events
    from telethon.tl.functions.channels import GetParticipantsRequest, InviteToChannelRequest
    from telethon.tl.types import ChannelParticipantsSearch
except ImportError:
    print("[!] Telethon не встановлено. Встановіть через: pip install -r engine/requirements.txt")
    sys.exit(1)

# Default official Telegram Desktop API keys
API_ID = 2040
API_HASH = "b18441a1ff607e10a989891a5462e627"

async def check_account(session_path: str):
    print(f"[*] Підключення до сесії: {session_path}")
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        print("[-] Сесія не авторизована!")
        await client.disconnect()
        return

    me = await client.get_me()
    print(f"[+] Успішний вхід: {me.first_name} {me.last_name or ''} (@{me.username or 'none'}), ID: {me.id}, Телефон: {me.phone}")

    # SpamBot check
    print("[*] Перевірка обмежень через @SpamBot...")
    await client.send_message("SpamBot", "/start")
    await asyncio.sleep(2)
    messages = await client.get_messages("SpamBot", limit=1)
    if messages:
        print(f"[+] Відповідь SpamBot:\n{messages[0].text}\n")

    await client.disconnect()

async def parse_chat(session_path: str, chat_handle: str, limit: int = 100):
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        print("[-] Сесія не авторизована!")
        return

    print(f"[*] Отримання сутності чату: {chat_handle}")
    chat = await client.get_entity(chat_handle)
    print(f"[+] Чат знайдено: {getattr(chat, 'title', chat_handle)}")

    offset = 0
    all_users = []

    while len(all_users) < limit:
        participants = await client(GetParticipantsRequest(
            channel=chat,
            filter=ChannelParticipantsSearch(''),
            offset=offset,
            limit=min(100, limit - len(all_users)),
            hash=0
        ))
        if not participants.users:
            break
        for u in participants.users:
            if not u.bot and u.username:
                all_users.append(f"@{u.username}")
        offset += len(participants.users)
        print(f"[*] Зібрано: {len(all_users)} контактів...")

    out_file = f"parsed_{chat_handle.replace('@', '')}.txt"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(all_users))

    print(f"[+] Готово! Збережено {len(all_users)} юзернеймів у файл: {out_file}")
    await client.disconnect()

async def send_msg(session_path: str, target: str, text: str):
    client = TelegramClient(session_path, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        print("[-] Сесія не авторизована!")
        return

    print(f"[*] Відправка повідомлення на {target}...")
    await client.send_message(target, text)
    print(f"[+] Повідомлення успішно відправлено на {target}!")
    await client.disconnect()

def main():
    parser = argparse.ArgumentParser(description="UmolkTG Standalone MTProto Runner")
    subparsers = parser.add_subparsers(dest="command")

    # Check
    check_parser = subparsers.add_parser("check", help="Перевірка акаунта та спамбота")
    check_parser.add_argument("--session", required=True, help="Шлях до .session файлу")

    # Parse
    parse_parser = subparsers.add_parser("parse", help="Парсинг чату")
    parse_parser.add_argument("--session", required=True, help="Шлях до .session файлу")
    parse_parser.add_argument("--chat", required=True, help="Юзернейм або лінк чату (@chat)")
    parse_parser.add_argument("--limit", type=int, default=100, help="Кількість контактів")

    # Send
    send_parser = subparsers.add_parser("send", help="Відправка повідомлення")
    send_parser.add_argument("--session", required=True, help="Шлях до .session файлу")
    send_parser.add_argument("--target", required=True, help="Отримувач (@username)")
    send_parser.add_argument("--text", required=True, help="Текст повідомлення")

    args = parser.parse_args()

    if args.command == "check":
        asyncio.run(check_account(args.session))
    elif args.command == "parse":
        asyncio.run(parse_chat(args.session, args.chat, args.limit))
    elif args.command == "send":
        asyncio.run(send_msg(args.session, args.target, args.text))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
