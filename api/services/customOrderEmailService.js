const createCustomOrderEmailTemplate = (order, subject, message) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f59e0b 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
            animation: float 20s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        .header .emoji {
            font-size: 50px;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
            animation: bounce 2s ease-in-out infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        .header p {
            position: relative;
            z-index: 1;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .order-card {
            background: linear-gradient(135deg, #fef2f2 0%, #fdf2f8 50%, #fff7ed 100%);
            border: 2px solid transparent;
            background-clip: padding-box;
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            position: relative;
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.1);
        }
        .order-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #dc2626, #f59e0b, #10b981);
            border-radius: 16px;
            padding: 2px;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            -webkit-mask-composite: xor;
        }
        .order-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .order-id {
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #dc2626, #f59e0b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .order-status {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .order-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .detail-item {
            background: rgba(255,255,255,0.9);
            padding: 16px;
            border-radius: 12px;
            border-left: 5px solid #dc2626;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .detail-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.05), rgba(245, 158, 11, 0.05));
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .detail-item:hover::before {
            opacity: 1;
        }
        .detail-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(220, 38, 38, 0.15);
        }
        .detail-label {
            font-weight: 600;
            color: #dc2626;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .detail-value {
            margin-top: 4px;
            font-size: 16px;
            color: #374151;
        }
        .payment-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%);
            border: 3px solid transparent;
            background-clip: padding-box;
            border-radius: 16px;
            padding: 35px;
            margin: 35px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .payment-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8, #06b6d4);
            border-radius: 16px;
            padding: 3px;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            -webkit-mask-composite: xor;
        }
        .payment-section::after {
            content: '💎';
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            opacity: 0.3;
        }
        .payment-amount {
            font-size: 36px;
            font-weight: 900;
            background: linear-gradient(135deg, #1e40af, #3b82f6, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 15px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.2); }
        }
        .payment-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #0ea5e9 100%);
            color: white;
            text-decoration: none;
            padding: 18px 36px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 18px;
            margin: 20px 0;
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .payment-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s ease;
        }
        .payment-button:hover::before {
            left: 100%;
        }
        .payment-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5);
        }
        .steps {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            position: relative;
        }
        .steps::before {
            content: '✨';
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 24px;
            opacity: 0.5;
        }
        .steps h3 {
            color: #dc2626;
            margin-bottom: 20px;
            text-align: center;
            font-size: 22px;
            font-weight: 700;
        }
        .step {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 15px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .step::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(135deg, #dc2626, #f59e0b);
        }
        .step:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 20px rgba(220, 38, 38, 0.15);
        }
        .step-number {
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            margin-right: 18px;
            flex-shrink: 0;
            box-shadow: 0 3px 10px rgba(220, 38, 38, 0.3);
            position: relative;
        }
        .step-number::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, #dc2626, #f59e0b);
            border-radius: 50%;
            z-index: -1;
            opacity: 0.5;
        }
        .footer {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #dc2626, #f59e0b, #10b981, #3b82f6, #8b5cf6);
        }
        .contact-info {
            background: rgba(75, 85, 99, 0.8);
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .social-links {
            margin-top: 25px;
        }
        .social-links a {
            color: #fbbf24;
            text-decoration: none;
            margin: 0 15px;
            font-weight: 600;
            transition: all 0.3s ease;
            padding: 5px 10px;
            border-radius: 5px;
        }
        .social-links a:hover {
            background: rgba(251, 191, 36, 0.2);
            transform: translateY(-2px);
        }
        @media (max-width: 600px) {
            .order-details {
                grid-template-columns: 1fr;
            }
            .container {
                margin: 0;
                box-shadow: none;
            }
            .content {
                padding: 20px;
            }
            .header, .footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="emoji">🧁</div>
            <h1>CakeShop</h1>
            <p>Your Custom Cake Specialists</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <h2 style="color: #dc2626; text-align: center; margin-bottom: 25px; font-size: 24px; font-weight: 700; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                🎉 ${subject} 🎉
            </h2>
            
            <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.8; color: #374151;">
                Dear <strong style="color: #dc2626;">${order.customerName}</strong>,
            </p>

            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
                <h3 style="color: #166534; margin-bottom: 10px; font-size: 20px;">🎂 Exciting News!</h3>
                <p style="color: #15803d; margin: 0; font-size: 16px; line-height: 1.6;">
                    Your custom cake order has been <strong>confirmed</strong> and we're thrilled to create something magical for your special occasion!
                </p>
            </div>

            <!-- Order Card -->
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order #${order.orderId}</div>
                    <span class="order-status">Confirmed ✓</span>
                </div>

                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Event Type</div>
                        <div class="detail-value">${order.eventType}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cake Size</div>
                        <div class="detail-value">${order.cakeSize}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Flavor</div>
                        <div class="detail-value">${order.flavor}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Delivery Date</div>
                        <div class="detail-value">${new Date(order.deliveryDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</div>
                    </div>
                </div>

                ${order.specialRequirements ? `
                <div class="detail-item" style="grid-column: 1 / -1; margin-top: 15px;">
                    <div class="detail-label">Special Requirements</div>
                    <div class="detail-value">${order.specialRequirements}</div>
                </div>
                ` : ''}
            </div>

            <!-- Payment Section -->
            ${order.advanceAmount && order.advanceAmount > 0 ? `
            <div class="payment-section">
                <h3 style="color: #1e40af; margin-bottom: 10px;">💳 Advance Payment Required</h3>
                <div style="font-size: 18px; color: #4b5563; margin-bottom: 10px;">
                    Total Estimated Price: <strong>LKR ${order.estimatedPrice?.toLocaleString()}</strong>
                </div>
                <div class="payment-amount">LKR ${order.advanceAmount.toLocaleString()}</div>
                <p style="color: #6b7280; margin: 15px 0;">
                    To proceed with your order, please pay the advance amount by visiting our website.
                </p>
                <a href="http://localhost:5173/custom-order" class="payment-button">
                    🎂 Pay Advance Now
                </a>
                <p style="font-size: 14px; color: #9ca3af; margin-top: 15px;">
                    Log in to your account and go to Custom Orders section to complete the payment.
                </p>
            </div>
            ` : ''}

            <!-- Process Steps -->
            <div class="steps">
                <h3>🔄 What Happens Next?</h3>
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong>Payment Confirmation</strong><br>
                        ${order.advanceAmount > 0 ? 'Complete your advance payment using the link above' : 'Your order is confirmed without advance payment'}
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong>Design & Preparation</strong><br>
                        Our expert bakers will start crafting your custom cake
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong>Quality Check</strong><br>
                        We ensure every detail meets our high standards
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div>
                        <strong>Ready for Delivery</strong><br>
                        Your cake will be ready on ${new Date(order.deliveryDate).toLocaleDateString()}
                    </div>
                </div>
            </div>

            ${order.adminNotes ? `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #92400e; margin-bottom: 10px;">📝 Special Notes from Our Team:</h4>
                <p style="color: #78350f; margin: 0;">${order.adminNotes}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0; padding: 25px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <h3 style="color: #166534; margin-bottom: 15px;">🎉 Thank You for Choosing CakeShop!</h3>
                <p style="color: #15803d; margin: 0;">
                    We're excited to create something amazing for your special occasion. 
                    Our team will keep you updated throughout the process.
                </p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
                Best regards,<br>
                <strong style="color: #dc2626;">The CakeShop Team</strong> 🧁
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="contact-info">
                <h3 style="margin-bottom: 15px; color: #fbbf24;">📞 Need Help?</h3>
                <p style="margin: 5px 0;">📧 Email: support@cakeshop.com</p>
                <p style="margin: 5px 0;">📱 Phone: (555) 123-4567</p>
                <p style="margin: 5px 0;">🕒 Hours: Mon-Sat 9AM-7PM</p>
            </div>
            
            <div class="social-links">
                <a href="#">Facebook</a> | 
                <a href="#">Instagram</a> | 
                <a href="#">WhatsApp</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">
                © 2025 CakeShop. All rights reserved.<br>
                This is an automated message, please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>`;
};

const createCustomOrderConfirmationTemplate = (order) => {
  const subject = `🎂 Custom Order Confirmed - Order #${order.orderId}`;
  const message = `Your custom cake order has been confirmed! We're excited to create something special for your ${order.eventType}.`;
  
  return {
    subject,
    html: createCustomOrderEmailTemplate(order, subject, message)
  };
};

const createAdvancePaymentRequestTemplate = (order) => {
  const subject = `💳 Advance Payment Required - Order #${order.orderId}`;
  const message = `Your custom cake order is ready to proceed! Please complete the advance payment to begin production.`;
  
  return {
    subject,
    html: createCustomOrderEmailTemplate(order, subject, message)
  };
};

module.exports = {
  createCustomOrderEmailTemplate,
  createCustomOrderConfirmationTemplate,
  createAdvancePaymentRequestTemplate
};
