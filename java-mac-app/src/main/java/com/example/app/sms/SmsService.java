package com.example.app.sms;

import java.util.List;
import java.util.UUID;

/**
 * SMS服务类
 * 提供短信发送功能，集成频率控制
 */
public class SmsService {
    
    private final SmsFrequencyController frequencyController;

    public SmsService() {
        this.frequencyController = new SmsFrequencyController();
    }

    /**
     * 发送短信
     * 
     * @param phoneNumber 手机号
     * @param content 短信内容
     * @return 发送结果
     */
    public SmsSendResult sendSms(String phoneNumber, String content) {
        // 验证输入参数
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new SmsSendResult(false, "手机号不能为空", null);
        }
        
        if (content == null || content.trim().isEmpty()) {
            return new SmsSendResult(false, "短信内容不能为空", null);
        }
        
        if (content.length() > 500) {
            return new SmsSendResult(false, "短信内容不能超过500个字符", null);
        }
        
        // 检查发送频率
        SmsValidationResult validation = frequencyController.canSendSms(phoneNumber);
        if (!validation.canSend()) {
            return new SmsSendResult(false, validation.getMessage(), null);
        }
        
        try {
            // 生成消息ID
            String messageId = generateMessageId();
            
            // 模拟发送短信（实际项目中这里会调用真实的短信服务提供商API）
            boolean sendSuccess = simulateSendSms(phoneNumber, content, messageId);
            
            if (sendSuccess) {
                // 记录发送成功
                frequencyController.recordSmsSent(phoneNumber, content, messageId);
                return new SmsSendResult(true, "短信发送成功", messageId);
            } else {
                return new SmsSendResult(false, "短信发送失败，请稍后重试", null);
            }
            
        } catch (Exception e) {
            return new SmsSendResult(false, "短信发送异常: " + e.getMessage(), null);
        }
    }
    
    /**
     * 批量发送短信
     * 
     * @param phoneNumbers 手机号列表
     * @param content 短信内容
     * @return 批量发送结果
     */
    public SmsBatchSendResult batchSendSms(List<String> phoneNumbers, String content) {
        if (phoneNumbers == null || phoneNumbers.isEmpty()) {
            return new SmsBatchSendResult(0, 0, List.of("手机号列表不能为空"));
        }
        
        SmsBatchSendResult result = new SmsBatchSendResult();
        
        for (String phoneNumber : phoneNumbers) {
            SmsSendResult sendResult = sendSms(phoneNumber, content);
            if (sendResult.isSuccess()) {
                result.incrementSuccessCount();
            } else {
                result.incrementFailureCount();
                result.addErrorMessage(phoneNumber + ": " + sendResult.getMessage());
            }
        }
        
        return result;
    }
    
    /**
     * 获取手机号发送统计
     * 
     * @param phoneNumber 手机号
     * @return 统计信息
     */
    public SmsStatistics getStatistics(String phoneNumber) {
        return frequencyController.getStatistics(phoneNumber);
    }
    
    /**
     * 获取所有手机号发送统计
     * 
     * @return 统计信息列表
     */
    public List<SmsStatistics> getAllStatistics() {
        return frequencyController.getAllStatistics();
    }
    
    /**
     * 检查是否可以向指定手机号发送短信
     * 
     * @param phoneNumber 手机号
     * @return 验证结果
     */
    public SmsValidationResult canSendSms(String phoneNumber) {
        return frequencyController.canSendSms(phoneNumber);
    }
    
    /**
     * 重置指定手机号的发送记录（管理员功能）
     * 
     * @param phoneNumber 手机号
     */
    public void resetPhoneNumber(String phoneNumber) {
        frequencyController.resetPhoneNumber(phoneNumber);
    }
    
    /**
     * 清空所有发送记录（管理员功能）
     */
    public void clearAllRecords() {
        frequencyController.clearAllRecords();
    }
    
    /**
     * 生成消息ID
     * 
     * @return 唯一的消息ID
     */
    private String generateMessageId() {
        return "SMS_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }
    
    /**
     * 模拟发送短信
     * 在实际项目中，这里会调用真实的短信服务提供商API
     * 
     * @param phoneNumber 手机号
     * @param content 短信内容
     * @param messageId 消息ID
     * @return 是否发送成功
     */
    private boolean simulateSendSms(String phoneNumber, String content, String messageId) {
        try {
            // 模拟网络延迟
            Thread.sleep(100);
            
            // 模拟95%的成功率
            return Math.random() < 0.95;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}