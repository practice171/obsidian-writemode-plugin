import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// ✅ 플러그인 설정 인터페이스 & 기본 값 설정
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

// ✅ 플러그인 클래스 정의
export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
    await this.loadSettings();
    this.injectCSS(); // CSS 적용

    // 🟢 좌측 리본 아이콘 추가 (클릭 시 전체 화면 모드 실행)
    const ribbonIconEl = this.addRibbonIcon('dice', 'Toggle Full Screen Editor', async (evt: MouseEvent) => {
        await this.toggleFullScreen();
    });
    ribbonIconEl.addClass('my-plugin-ribbon-class');

    // 🟢 Command Palette에서도 전체 화면 모드 실행 가능
    this.addCommand({
        id: "toggle-fullscreen-editor",
        name: "Toggle Full Screen Editor",
        callback: async () => {
            await this.toggleFullScreen();
        }
    });

    // 🟢 ESC 키 감지 후 전체 화면 해제 및 CSS 재적용
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && document.fullscreenElement) {
            console.log("ESC 키 감지됨: 전체 화면 해제");
            this.forceExitFullScreen();
        }
    });

    // 🟢 전체 화면 변경 감지 (ESC + 명령어 팔레트 감지)
    document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) {
            console.log("📢 전체 화면 종료 감지됨");
            this.forceExitFullScreen();
        }
    });

    // 🟢 설정 탭 추가
    this.addSettingTab(new SampleSettingTab(this.app, this));
}

// ✅ 전체 화면 모드 토글 함수
async toggleFullScreen() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (markdownView) {
        const container = markdownView.containerEl;

        if (document.fullscreenElement) {
            await this.forceExitFullScreen(); // 🟢 ESC & Command Palette에서 해제 시 CSS 재적용
        } else {
            container.classList.add("fullscreen-editor");
            await container.requestFullscreen(); // 전체 화면 적용
        }
    }
}

// ✅ 전체 화면 해제 시 강제 복구 (ESC & 명령어 팔레트 감지)
async forceExitFullScreen() {
    if (document.fullscreenElement) {
        await document.exitFullscreen(); // 전체 화면 해제
    }
    this.refreshLayout(); // 🟢 CSS 및 UI 강제 복구
}

// ✅ 레이아웃 강제 새로고침 (CSS + Obsidian UI 복구)
refreshLayout() {
    console.log("🔄 CSS 및 레이아웃을 강제 복구합니다...");

    // 기존 CSS 제거 후 다시 적용
    const oldStyle = document.getElementById("fullscreen-editor-style");
    if (oldStyle) {
        oldStyle.remove();
    }
    this.injectCSS(); // 새 CSS 적용

    // 🟢 Obsidian의 기본 레이아웃 강제 복구 (패널 위치 초기화)
    this.app.workspace.leftSplit.collapse();
    this.app.workspace.rightSplit.collapse();
    setTimeout(() => {
        this.app.workspace.leftSplit.expand();
        this.app.workspace.rightSplit.expand();
    }, 50);
}

// ✅ CSS 삽입 함수 (전체 화면 스타일 적용)
injectCSS() {
    const style = document.createElement("style");
    style.id = "fullscreen-editor-style";
    style.innerHTML = `
        .fullscreen-editor {
            position: fixed !important;
            top: 0;
            left: 0;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999;
            background: var(--background-primary);
            display: flex;
            flex-direction: column;
        }

        /* 🟢 전체 화면 모드 해제 후에도 레이아웃이 원래대로 돌아오도록 추가 */
        .workspace-split.mod-root {
            width: 100% !important;
        }
    `;
    document.head.appendChild(style);
}


	// ✅ 플러그인 비활성화 시 호출되는 함수
	onunload() {
		console.log("Unloading plugin...");
	}

	// ✅ 설정 데이터 불러오기
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	// ✅ 설정 데이터 저장하기
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// ✅ 모달 클래스 (예제)
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// ✅ 설정 탭 클래스 (예제)
class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
