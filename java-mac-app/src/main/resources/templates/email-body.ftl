Hello ${user.firstName},

Thanks for your order ${order.id} placed on ${order.date?string("yyyy-MM-dd")}.

Items:
<#list order.items as item>
- ${item.name} x${item.quantity} @ ${item.unitPrice?string["0.00"]} = ${item.lineTotal?string["0.00"]}
</#list>

Total: ${order.total?string["0.00"]}

Shipping address:
${order.shipping.address1}
${order.shipping.city}, ${order.shipping.region} ${order.shipping.postal}

You can review your order at:
${loginUrl}

If you have any questions, contact us at ${supportEmail}.

Regards,
${senderName}
Generated on ${generatedAt?string("yyyy-MM-dd")}
