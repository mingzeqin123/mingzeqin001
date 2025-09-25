#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
百度翻译GUI界面程序
使用tkinter创建简单的图形用户界面
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
from baidu_translator import BaiduTranslator


class TranslateGUI:
    """翻译GUI界面类"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("百度翻译工具")
        self.root.geometry("800x600")
        self.root.resizable(True, True)
        
        # 初始化翻译器
        try:
            self.translator = BaiduTranslator()
            self.setup_ui()
        except ValueError as e:
            self.show_config_error(str(e))
    
    def setup_ui(self):
        """设置用户界面"""
        # 主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 配置网格权重
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        main_frame.rowconfigure(4, weight=1)
        
        # 标题
        title_label = ttk.Label(main_frame, text="百度翻译工具", font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # 语言选择框架
        lang_frame = ttk.LabelFrame(main_frame, text="语言设置", padding="10")
        lang_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        lang_frame.columnconfigure(1, weight=1)
        lang_frame.columnconfigure(3, weight=1)
        
        # 源语言选择
        ttk.Label(lang_frame, text="源语言:").grid(row=0, column=0, padx=(0, 5))
        self.from_lang_var = tk.StringVar(value="zh")
        from_lang_combo = ttk.Combobox(lang_frame, textvariable=self.from_lang_var, 
                                     values=list(self.translator.get_supported_languages().values()),
                                     state="readonly", width=15)
        from_lang_combo.grid(row=0, column=1, padx=(0, 20))
        
        # 目标语言选择
        ttk.Label(lang_frame, text="目标语言:").grid(row=0, column=2, padx=(0, 5))
        self.to_lang_var = tk.StringVar(value="en")
        to_lang_combo = ttk.Combobox(lang_frame, textvariable=self.to_lang_var,
                                   values=list(self.translator.get_supported_languages().values()),
                                   state="readonly", width=15)
        to_lang_combo.grid(row=0, column=3)
        
        # 输入区域
        input_frame = ttk.LabelFrame(main_frame, text="输入文本", padding="10")
        input_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        input_frame.columnconfigure(0, weight=1)
        input_frame.rowconfigure(0, weight=1)
        
        self.input_text = scrolledtext.ScrolledText(input_frame, height=8, wrap=tk.WORD)
        self.input_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 按钮框架
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=3, pady=(0, 10))
        
        # 翻译按钮
        self.translate_button = ttk.Button(button_frame, text="翻译", command=self.start_translation)
        self.translate_button.pack(side=tk.LEFT, padx=(0, 10))
        
        # 清空按钮
        clear_button = ttk.Button(button_frame, text="清空", command=self.clear_text)
        clear_button.pack(side=tk.LEFT, padx=(0, 10))
        
        # 交换语言按钮
        swap_button = ttk.Button(button_frame, text="交换语言", command=self.swap_languages)
        swap_button.pack(side=tk.LEFT)
        
        # 输出区域
        output_frame = ttk.LabelFrame(main_frame, text="翻译结果", padding="10")
        output_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S))
        output_frame.columnconfigure(0, weight=1)
        output_frame.rowconfigure(0, weight=1)
        
        self.output_text = scrolledtext.ScrolledText(output_frame, height=8, wrap=tk.WORD, state=tk.DISABLED)
        self.output_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 状态栏
        self.status_var = tk.StringVar(value="就绪")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN)
        status_bar.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(10, 0))
        
        # 绑定回车键翻译
        self.root.bind('<Control-Return>', lambda e: self.start_translation())
        
        # 设置焦点
        self.input_text.focus()
    
    def start_translation(self):
        """开始翻译（在新线程中执行）"""
        text = self.input_text.get("1.0", tk.END).strip()
        if not text:
            messagebox.showwarning("警告", "请输入要翻译的文本")
            return
        
        # 禁用翻译按钮
        self.translate_button.config(state=tk.DISABLED)
        self.status_var.set("正在翻译...")
        
        # 在新线程中执行翻译
        thread = threading.Thread(target=self.translate_text, args=(text,))
        thread.daemon = True
        thread.start()
    
    def translate_text(self, text):
        """执行翻译"""
        try:
            from_lang = self.from_lang_var.get()
            to_lang = self.to_lang_var.get()
            
            result = self.translator.translate(text, from_lang, to_lang)
            
            # 在主线程中更新UI
            self.root.after(0, self.update_result, result)
            
        except Exception as e:
            self.root.after(0, self.show_error, f"翻译过程中发生错误: {str(e)}")
    
    def update_result(self, result):
        """更新翻译结果"""
        # 重新启用翻译按钮
        self.translate_button.config(state=tk.NORMAL)
        
        if result.get("success"):
            # 清空输出区域
            self.output_text.config(state=tk.NORMAL)
            self.output_text.delete("1.0", tk.END)
            
            # 显示翻译结果
            translated_text = result['translated_text']
            self.output_text.insert("1.0", translated_text)
            self.output_text.config(state=tk.DISABLED)
            
            self.status_var.set("翻译完成")
        else:
            error_msg = result.get("error", "未知错误")
            self.show_error(f"翻译失败: {error_msg}")
    
    def show_error(self, message):
        """显示错误信息"""
        self.translate_button.config(state=tk.NORMAL)
        self.status_var.set("翻译失败")
        messagebox.showerror("错误", message)
    
    def clear_text(self):
        """清空输入和输出文本"""
        self.input_text.delete("1.0", tk.END)
        self.output_text.config(state=tk.NORMAL)
        self.output_text.delete("1.0", tk.END)
        self.output_text.config(state=tk.DISABLED)
        self.status_var.set("已清空")
        self.input_text.focus()
    
    def swap_languages(self):
        """交换源语言和目标语言"""
        from_lang = self.from_lang_var.get()
        to_lang = self.to_lang_var.get()
        
        self.from_lang_var.set(to_lang)
        self.to_lang_var.set(from_lang)
        self.status_var.set("语言已交换")
    
    def show_config_error(self, error_message):
        """显示配置错误信息"""
        error_frame = ttk.Frame(self.root, padding="20")
        error_frame.pack(expand=True, fill=tk.BOTH)
        
        ttk.Label(error_frame, text="配置错误", font=("Arial", 14, "bold")).pack(pady=(0, 10))
        
        error_text = scrolledtext.ScrolledText(error_frame, height=15, wrap=tk.WORD)
        error_text.pack(expand=True, fill=tk.BOTH, pady=(0, 10))
        
        config_instructions = f"""
{error_message}

请按照以下步骤配置百度翻译API:

1. 访问 https://fanyi-api.baidu.com/
2. 注册并创建应用获取APP ID和密钥
3. 编辑 baidu_translate_config.py 文件
4. 将 your_app_id_here 替换为你的APP ID
5. 将 your_secret_key_here 替换为你的密钥

配置完成后重新运行程序。

支持的API错误代码:
- 52001: 请求超时，请重试
- 52002: 系统错误，请重试  
- 52003: 未授权用户，请检查APP ID和密钥
- 54000: 必填参数为空
- 54001: 签名错误
- 54003: 访问频率受限
- 54004: 账户余额不足
- 54005: 长query请求频繁
- 58000: 客户端IP非法
- 90107: 认证未通过或未生效
        """
        
        error_text.insert("1.0", config_instructions)
        error_text.config(state=tk.DISABLED)
        
        ttk.Button(error_frame, text="退出", command=self.root.quit).pack()


def main():
    """主函数"""
    root = tk.Tk()
    app = TranslateGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()