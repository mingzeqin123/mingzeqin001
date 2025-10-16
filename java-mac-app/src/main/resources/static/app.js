/**
 * MidJourney 参数构建器前端 JavaScript
 * 处理用户交互和后端API调用
 */

// API基础URL
const API_BASE_URL = '/api/midjourney';

// 当前参数对象
let currentParameters = {};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDefault();
});

/**
 * 初始化应用程序
 */
function initializeApp() {
    console.log('MidJourney 参数构建器已启动');
    
    // 初始化工具提示
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // 设置范围滑块的初始值显示
    updateRangeValue('stylize', document.getElementById('stylize').value);
    updateRangeValue('chaos', document.getElementById('chaos').value);
    updateRangeValue('weirdValue', document.getElementById('weirdValue').value);
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 奇异模式复选框变化
    document.getElementById('weird').addEventListener('change', function() {
        const weirdContainer = document.getElementById('weirdValueContainer');
        weirdContainer.style.display = this.checked ? 'block' : 'none';
    });
    
    // 提示词输入变化时获取建议
    let promptTimeout;
    document.getElementById('prompt').addEventListener('input', function() {
        clearTimeout(promptTimeout);
        promptTimeout = setTimeout(() => {
            if (this.value.trim().length > 10) {
                getSuggestions();
            }
        }, 1000);
    });
    
    // 表单字段变化时自动构建命令
    const formFields = ['prompt', 'negativePrompt', 'aspectRatio', 'quality', 'stylize', 'chaos', 'seed', 'model'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', debounce(buildCommand, 500));
        }
    });
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 更新范围滑块显示值
 */
function updateRangeValue(id, value) {
    const valueElement = document.getElementById(id + 'Value');
    if (valueElement) {
        valueElement.textContent = value;
        
        // 更新滑块位置
        const slider = document.getElementById(id);
        const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
        valueElement.style.left = percent + '%';
    }
}

/**
 * 切换高级参数显示
 */
function toggleAdvanced() {
    const advancedSection = document.getElementById('advancedSection');
    const isVisible = advancedSection.classList.contains('show');
    
    if (isVisible) {
        advancedSection.classList.remove('show');
    } else {
        advancedSection.classList.add('show');
    }
}

/**
 * 加载预设参数
 */
async function loadPreset(presetType) {
    showLoading(true);
    hideAlerts();
    
    try {
        const response = await fetch(`${API_BASE_URL}/preset/${presetType}`);
        const data = await response.json();
        
        if (data.success) {
            fillFormWithParameters(data.parameters);
            showSuccess(`已加载 ${getPresetName(presetType)} 预设`);
            
            // 自动构建命令
            setTimeout(() => buildCommand(), 100);
        } else {
            showError(data.error || '加载预设失败');
        }
    } catch (error) {
        console.error('加载预设错误:', error);
        showError('网络错误，请检查连接');
    } finally {
        showLoading(false);
    }
}

/**
 * 获取预设名称
 */
function getPresetName(presetType) {
    const names = {
        'portrait': '人像摄影',
        'landscape': '风景摄影',
        'anime': '动漫风格',
        'realistic': '写实风格',
        'abstract': '抽象艺术',
        'minimalist': '极简主义'
    };
    return names[presetType] || presetType;
}

/**
 * 加载默认参数
 */
async function loadDefault() {
    showLoading(true);
    hideAlerts();
    
    try {
        const response = await fetch(`${API_BASE_URL}/default`);
        const data = await response.json();
        
        if (data.success) {
            fillFormWithParameters(data.parameters);
            showSuccess('已加载默认设置');
        } else {
            showError(data.error || '加载默认设置失败');
        }
    } catch (error) {
        console.error('加载默认设置错误:', error);
        showError('网络错误，请检查连接');
    } finally {
        showLoading(false);
    }
}

/**
 * 用参数填充表单
 */
function fillFormWithParameters(parameters) {
    // 基础参数
    setFieldValue('prompt', parameters.prompt || '');
    setFieldValue('negativePrompt', parameters.negativePrompt || '');
    setFieldValue('aspectRatio', parameters.aspectRatio || 'SQUARE');
    setFieldValue('quality', parameters.quality || 'STANDARD');
    setFieldValue('stylize', parameters.stylize || 100);
    setFieldValue('chaos', parameters.chaos || 0);
    setFieldValue('seed', parameters.seed || '');
    setFieldValue('model', parameters.model || '6');
    
    // 高级参数
    setFieldValue('artStyle', parameters.artStyle || '');
    setFieldValue('lightingStyle', parameters.lightingStyle || '');
    setFieldValue('colorPalette', parameters.colorPalette || '');
    setFieldValue('cameraAngle', parameters.cameraAngle || '');
    
    // 特殊选项
    document.getElementById('tile').checked = parameters.tile || false;
    document.getElementById('weird').checked = parameters.weird || false;
    setFieldValue('weirdValue', parameters.weirdValue || 0);
    
    // 更新范围滑块显示
    updateRangeValue('stylize', parameters.stylize || 100);
    updateRangeValue('chaos', parameters.chaos || 0);
    updateRangeValue('weirdValue', parameters.weirdValue || 0);
    
    // 显示/隐藏奇异值容器
    const weirdContainer = document.getElementById('weirdValueContainer');
    weirdContainer.style.display = parameters.weird ? 'block' : 'none';
    
    currentParameters = parameters;
}

/**
 * 设置表单字段值
 */
function setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.value = value;
    }
}

/**
 * 从表单收集参数
 */
function collectParameters() {
    const parameters = {
        prompt: document.getElementById('prompt').value.trim(),
        negativePrompt: document.getElementById('negativePrompt').value.trim(),
        aspectRatio: document.getElementById('aspectRatio').value,
        quality: document.getElementById('quality').value,
        stylize: parseFloat(document.getElementById('stylize').value),
        chaos: parseFloat(document.getElementById('chaos').value),
        seed: document.getElementById('seed').value ? parseInt(document.getElementById('seed').value) : null,
        model: document.getElementById('model').value,
        artStyle: document.getElementById('artStyle').value,
        lightingStyle: document.getElementById('lightingStyle').value,
        colorPalette: document.getElementById('colorPalette').value,
        cameraAngle: document.getElementById('cameraAngle').value,
        tile: document.getElementById('tile').checked,
        weird: document.getElementById('weird').checked,
        weirdValue: parseFloat(document.getElementById('weirdValue').value),
        stopWords: [], // 可以后续添加
        imageWeight: 1.0 // 可以后续添加
    };
    
    return parameters;
}

/**
 * 构建MidJourney命令
 */
async function buildCommand() {
    const parameters = collectParameters();
    
    // 基础验证
    if (!parameters.prompt) {
        showError('请输入主要提示词');
        return;
    }
    
    showLoading(true);
    hideAlerts();
    
    try {
        const response = await fetch(`${API_BASE_URL}/build-command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(parameters)
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResult(data.command);
            currentParameters = data.data;
            showSuccess('命令构建成功！');
        } else {
            showError(data.errors ? data.errors.join(', ') : (data.error || '构建命令失败'));
        }
    } catch (error) {
        console.error('构建命令错误:', error);
        showError('网络错误，请检查连接');
    } finally {
        showLoading(false);
    }
}

/**
 * 显示结果
 */
function displayResult(command) {
    const resultSection = document.getElementById('resultSection');
    const commandOutput = document.getElementById('commandOutput');
    
    // 移除复制按钮后设置命令文本
    const copyBtn = commandOutput.querySelector('.copy-btn');
    commandOutput.textContent = command;
    
    // 重新添加复制按钮
    if (copyBtn) {
        commandOutput.appendChild(copyBtn);
    }
    
    resultSection.style.display = 'block';
    
    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 复制命令到剪贴板
 */
async function copyCommand() {
    const commandOutput = document.getElementById('commandOutput');
    const command = commandOutput.textContent.replace('复制', '').trim();
    
    try {
        await navigator.clipboard.writeText(command);
        showSuccess('命令已复制到剪贴板！');
        
        // 临时改变按钮文本
        const copyBtn = commandOutput.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('复制失败:', error);
        showError('复制失败，请手动复制');
    }
}

/**
 * 获取智能建议
 */
async function getSuggestions() {
    const prompt = document.getElementById('prompt').value.trim();
    
    if (!prompt) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });
        
        const data = await response.json();
        
        if (data.success && Object.keys(data.suggestions).length > 0) {
            applySuggestions(data.suggestions);
            showSuccess('已应用智能建议');
        }
    } catch (error) {
        console.error('获取建议错误:', error);
    }
}

/**
 * 应用建议
 */
function applySuggestions(suggestions) {
    if (suggestions.aspectRatio) {
        setFieldValue('aspectRatio', suggestions.aspectRatio);
    }
    if (suggestions.stylize) {
        setFieldValue('stylize', suggestions.stylize);
        updateRangeValue('stylize', suggestions.stylize);
    }
    if (suggestions.chaos) {
        setFieldValue('chaos', suggestions.chaos);
        updateRangeValue('chaos', suggestions.chaos);
    }
    if (suggestions.lightingStyle) {
        setFieldValue('lightingStyle', suggestions.lightingStyle);
    }
    if (suggestions.artStyle) {
        setFieldValue('artStyle', suggestions.artStyle);
    }
}

/**
 * 生成随机种子
 */
async function generateRandomSeed() {
    try {
        const response = await fetch(`${API_BASE_URL}/random-seed`);
        const data = await response.json();
        
        if (data.success) {
            setFieldValue('seed', data.seed);
            showSuccess(`已生成随机种子: ${data.seed}`);
        } else {
            showError(data.error || '生成随机种子失败');
        }
    } catch (error) {
        console.error('生成随机种子错误:', error);
        showError('网络错误，请检查连接');
    }
}

/**
 * 重置表单
 */
function resetForm() {
    // 重置所有表单字段
    document.getElementById('prompt').value = '';
    document.getElementById('negativePrompt').value = '';
    document.getElementById('aspectRatio').value = 'SQUARE';
    document.getElementById('quality').value = 'STANDARD';
    document.getElementById('stylize').value = 100;
    document.getElementById('chaos').value = 0;
    document.getElementById('seed').value = '';
    document.getElementById('model').value = '6';
    document.getElementById('artStyle').value = '';
    document.getElementById('lightingStyle').value = '';
    document.getElementById('colorPalette').value = '';
    document.getElementById('cameraAngle').value = '';
    document.getElementById('tile').checked = false;
    document.getElementById('weird').checked = false;
    document.getElementById('weirdValue').value = 0;
    
    // 更新范围滑块显示
    updateRangeValue('stylize', 100);
    updateRangeValue('chaos', 0);
    updateRangeValue('weirdValue', 0);
    
    // 隐藏奇异值容器
    document.getElementById('weirdValueContainer').style.display = 'none';
    
    // 隐藏结果区域
    document.getElementById('resultSection').style.display = 'none';
    
    hideAlerts();
    showSuccess('表单已重置');
}

/**
 * 显示加载状态
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'block' : 'none';
}

/**
 * 显示成功消息
 */
function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    const messageElement = document.getElementById('successMessage');
    
    messageElement.textContent = message;
    alert.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

/**
 * 显示错误消息
 */
function showError(message) {
    const alert = document.getElementById('errorAlert');
    const messageElement = document.getElementById('errorMessage');
    
    messageElement.textContent = message;
    alert.style.display = 'block';
    
    // 5秒后自动隐藏
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

/**
 * 隐藏所有提示
 */
function hideAlerts() {
    document.getElementById('successAlert').style.display = 'none';
    document.getElementById('errorAlert').style.display = 'none';
}

/**
 * 导出当前参数为JSON
 */
function exportParameters() {
    const parameters = collectParameters();
    const dataStr = JSON.stringify(parameters, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'midjourney-parameters.json';
    link.click();
    
    showSuccess('参数已导出');
}

/**
 * 导入参数JSON文件
 */
function importParameters() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parameters = JSON.parse(e.target.result);
                    fillFormWithParameters(parameters);
                    showSuccess('参数已导入');
                } catch (error) {
                    showError('导入失败：文件格式错误');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// 全局函数，供HTML调用
window.updateRangeValue = updateRangeValue;
window.toggleAdvanced = toggleAdvanced;
window.loadPreset = loadPreset;
window.loadDefault = loadDefault;
window.buildCommand = buildCommand;
window.copyCommand = copyCommand;
window.getSuggestions = getSuggestions;
window.generateRandomSeed = generateRandomSeed;
window.resetForm = resetForm;
window.exportParameters = exportParameters;
window.importParameters = importParameters;