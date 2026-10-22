#!/usr/bin/env python3
"""
API Key Checker - Tests if API keys are valid for different providers.
Usage: python api_checker.py
"""

import os
import sys
import requests
from pathlib import Path

# Load .env.local
ENV_FILE = Path(__file__).parent / ".env.local"
if ENV_FILE.exists():
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key] = val


def check_groq(api_key: str) -> tuple[bool, str]:
    """Test Groq API key."""
    if not api_key:
        return False, "GROQ_API_KEY not set"
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        if resp.status_code == 200:
            models = resp.json().get("data", [])
            return True, f"Valid - {len(models)} models available"
        elif resp.status_code == 401:
            return False, "Invalid API key (401)"
        else:
            return False, f"Error {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return False, f"Connection failed: {e}"


def check_google(api_key: str) -> tuple[bool, str]:
    """Test Google Generative AI API key."""
    if not api_key:
        return False, "GOOGLE_API_KEY not set"
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            return True, f"Valid - {len(models)} models available"
        elif resp.status_code == 400:
            return False, "Invalid API key (400)"
        else:
            return False, f"Error {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return False, f"Connection failed: {e}"


def check_openai(api_key: str) -> tuple[bool, str]:
    """Test OpenAI API key."""
    if not api_key:
        return False, "OPENAI_API_KEY not set"
    try:
        headers = {"Authorization": f"Bearer {api_key}"}
        resp = requests.get("https://api.openai.com/v1/models", headers=headers, timeout=10)
        if resp.status_code == 200:
            models = resp.json().get("data", [])
            return True, f"Valid - {len(models)} models available"
        elif resp.status_code == 401:
            return False, "Invalid API key (401)"
        else:
            return False, f"Error {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return False, f"Connection failed: {e}"


def check_anthropic(api_key: str) -> tuple[bool, str]:
    """Test Anthropic API key."""
    if not api_key:
        return False, "ANTHROPIC_API_KEY not set"
    try:
        headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01"}
        resp = requests.get("https://api.anthropic.com/v1/models", headers=headers, timeout=10)
        if resp.status_code == 200:
            models = resp.json().get("data", [])
            return True, f"Valid - {len(models)} models available"
        elif resp.status_code == 401:
            return False, "Invalid API key (401)"
        else:
            return False, f"Error {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return False, f"Connection failed: {e}"


def check_supabase(url: str, key: str) -> tuple[bool, str]:
    """Test Supabase connection."""
    if not url or not key:
        return False, "Supabase URL or key not set"
    try:
        headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        resp = requests.get(f"{url}/rest/v1/", headers=headers, timeout=10)
        if resp.status_code in (200, 404):  # 404 is ok - means auth worked
            return True, "Valid - Connected to Supabase"
        elif resp.status_code == 401:
            return False, "Invalid Supabase key (401)"
        else:
            return False, f"Error {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        return False, f"Connection failed: {e}"


def main():
    print("=" * 60)
    print("  API KEY CHECKER - Synapse")
    print("=" * 60)

    checks = [
        ("Groq", "GROQ_API_KEY", check_groq),
        ("Google AI", "GOOGLE_API_KEY", check_google),
        ("OpenAI", "OPENAI_API_KEY", check_openai),
        ("Anthropic", "ANTHROPIC_API_KEY", check_anthropic),
        ("Supabase", ("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), check_supabase),
    ]

    results = []
    for name, env_key, checker in checks:
        if isinstance(env_key, tuple):
            keys = [os.getenv(k) for k in env_key]
            ok, msg = checker(*keys)
        else:
            ok, msg = checker(os.getenv(env_key))

        status = "[PASS]" if ok else "[FAIL]"
        print(f"\n{name:15} {status}")
        print(f"  {msg}")
        results.append((name, ok))

    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    for name, ok in results:
        print(f"  {name:15} {'[Working]' if ok else '[Not configured / Invalid]'}")

    working = sum(1 for _, ok in results if ok)
    print(f"\n  {working}/{len(results)} APIs working")

    if working == 0:
        print("\n  [!] No working APIs found. Check .env.local")
        sys.exit(1)


if __name__ == "__main__":
    main()