import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('System Files & Deployment Integrity', () => {
  it('install.sh should exist and have valid bash syntax', () => {
    const installScriptPath = path.resolve(process.cwd(), 'install.sh');
    expect(fs.existsSync(installScriptPath)).toBe(true);

    const content = fs.readFileSync(installScriptPath, 'utf-8');
    expect(content).toContain('UmolkTG');
    expect(content).toContain('/opt/umolktg');
    expect(content).toContain('docker compose');

    // Run bash syntax check: bash -n install.sh
    const checkResult = execSync(`bash -n "${installScriptPath}"`, { encoding: 'utf-8' });
    expect(checkResult).toBe('');
  });

  it('docker-compose.yml should be valid and define umolktg services', () => {
    const composePath = path.resolve(process.cwd(), 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const composeContent = fs.readFileSync(composePath, 'utf-8');
    expect(composeContent).toContain('umolktg-web');
    expect(composeContent).toContain('umolktg-voip-daemon');
    expect(composeContent).toContain('3000:3000');
  });

  it('Dockerfile should exist and define node container build', () => {
    const dockerfilePath = path.resolve(process.cwd(), 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
    expect(dockerfileContent).toContain('FROM node');
    expect(dockerfileContent).toContain('EXPOSE 3000');
    expect(dockerfileContent).toContain('npm run build');
  });

  it('cpp-daemon should have valid CMakeLists.txt and source files', () => {
    const cmakePath = path.resolve(process.cwd(), 'cpp-daemon/CMakeLists.txt');
    const mainCppPath = path.resolve(process.cwd(), 'cpp-daemon/src/main.cpp');
    const daemonDockerPath = path.resolve(process.cwd(), 'cpp-daemon/Dockerfile');

    expect(fs.existsSync(cmakePath)).toBe(true);
    expect(fs.existsSync(mainCppPath)).toBe(true);
    expect(fs.existsSync(daemonDockerPath)).toBe(true);

    const cmakeContent = fs.readFileSync(cmakePath, 'utf-8');
    expect(cmakeContent).toContain('project(umolktg_voip_daemon');

    const mainCppContent = fs.readFileSync(mainCppPath, 'utf-8');
    expect(mainCppContent).toContain('UmolkTG Pro');
    expect(mainCppContent).toContain('tgcalls');

    const daemonDockerContent = fs.readFileSync(daemonDockerPath, 'utf-8');
    expect(daemonDockerContent).toContain('umolktg_voip_daemon');
  });

  it('metadata.json should be valid JSON and define project properties', () => {
    const metadataPath = path.resolve(process.cwd(), 'metadata.json');
    expect(fs.existsSync(metadataPath)).toBe(true);

    const raw = fs.readFileSync(metadataPath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('name');
    expect(parsed).toHaveProperty('description');
  });

  it('index.html should have UmolkTG branding in title and meta', () => {
    const indexPath = path.resolve(process.cwd(), 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain('<title>UmolkTG — Telegram Combiner & Headless VoIP</title>');
    expect(indexContent).toContain('UmolkTG');
  });
});
