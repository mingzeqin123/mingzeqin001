package com.example.app.sms;

import java.util.ArrayList;
import java.util.List;

/**
 * SMS批量发送结果类
 * 包含批量发送的统计信息和错误消息
 */
public class SmsBatchSendResult {
    private int successCount;
    private int failureCount;
    private final List<String> errorMessages;

    public SmsBatchSendResult() {
        this.successCount = 0;
        this.failureCount = 0;
        this.errorMessages = new ArrayList<>();
    }

    public SmsBatchSendResult(int successCount, int failureCount, List<String> errorMessages) {
        this.successCount = successCount;
        this.failureCount = failureCount;
        this.errorMessages = new ArrayList<>(errorMessages);
    }

    /**
     * 获取成功发送数量
     * 
     * @return 成功发送数量
     */
    public int getSuccessCount() {
        return successCount;
    }

    /**
     * 获取失败发送数量
     * 
     * @return 失败发送数量
     */
    public int getFailureCount() {
        return failureCount;
    }

    /**
     * 获取总发送数量
     * 
     * @return 总发送数量
     */
    public int getTotalCount() {
        return successCount + failureCount;
    }

    /**
     * 获取错误消息列表
     * 
     * @return 错误消息列表
     */
    public List<String> getErrorMessages() {
        return new ArrayList<>(errorMessages);
    }

    /**
     * 增加成功计数
     */
    public void incrementSuccessCount() {
        this.successCount++;
    }

    /**
     * 增加失败计数
     */
    public void incrementFailureCount() {
        this.failureCount++;
    }

    /**
     * 添加错误消息
     * 
     * @param errorMessage 错误消息
     */
    public void addErrorMessage(String errorMessage) {
        this.errorMessages.add(errorMessage);
    }

    /**
     * 是否全部发送成功
     * 
     * @return true表示全部成功，false表示有失败
     */
    public boolean isAllSuccess() {
        return failureCount == 0 && successCount > 0;
    }

    /**
     * 获取成功率
     * 
     * @return 成功率（0.0 - 1.0）
     */
    public double getSuccessRate() {
        int total = getTotalCount();
        if (total == 0) {
            return 0.0;
        }
        return (double) successCount / total;
    }

    /**
     * 获取成功率百分比字符串
     * 
     * @return 成功率百分比字符串
     */
    public String getSuccessRatePercentage() {
        return String.format("%.1f%%", getSuccessRate() * 100);
    }

    @Override
    public String toString() {
        return String.format("批量发送结果: 成功 %d 条, 失败 %d 条, 成功率 %s",
                successCount, failureCount, getSuccessRatePercentage());
    }
}