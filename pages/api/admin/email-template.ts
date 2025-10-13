import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import EmailTemplate from '@/lib/models/EmailTemplate';
import { AuthUtils } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication and admin role
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const decodedToken = AuthUtils.verifyAccessToken(token);
    if (!decodedToken || !['ADMIN', 'DATA_ENTRY'].includes(decodedToken.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await connectDB();

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
        return handlePut(req, res);
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Email template API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.query;

  if (name) {
    // Get specific template
    const template = await EmailTemplate.findOne({ name });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  }

  // Get all templates
  const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: templates,
  });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { name, subject, heading, bodyText, buttonText, footerText, primaryColor } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Template name is required' });
  }

  // Check if template already exists
  const existingTemplate = await EmailTemplate.findOne({ name });
  if (existingTemplate) {
    return res.status(400).json({ success: false, error: 'Template with this name already exists' });
  }

  const template = await EmailTemplate.create({
    name,
    subject: subject || 'Verify Your Email - Umbrella Stock',
    heading: heading || 'Verify Your Email Address',
    bodyText: bodyText || 'Thank you for subscribing to Umbrella Stock! To complete your subscription and start receiving market insights, investment updates, and exclusive content, please verify your email address by clicking the button below.',
    buttonText: buttonText || 'Verify Email Address',
    footerText: footerText || "If you didn't subscribe to Umbrella Stock, you can safely ignore this email.",
    primaryColor: primaryColor || '#FF6B2C',
    isActive: true,
  });

  return res.status(201).json({
    success: true,
    message: 'Email template created successfully',
    data: template,
  });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { name, subject, heading, bodyText, buttonText, footerText, primaryColor, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'Template name is required' });
  }

  const template = await EmailTemplate.findOne({ name });

  if (!template) {
    return res.status(404).json({ success: false, error: 'Template not found' });
  }

  // Update fields
  if (subject !== undefined) template.subject = subject;
  if (heading !== undefined) template.heading = heading;
  if (bodyText !== undefined) template.bodyText = bodyText;
  if (buttonText !== undefined) template.buttonText = buttonText;
  if (footerText !== undefined) template.footerText = footerText;
  if (primaryColor !== undefined) template.primaryColor = primaryColor;
  if (isActive !== undefined) template.isActive = isActive;

  await template.save();

  return res.status(200).json({
    success: true,
    message: 'Email template updated successfully',
    data: template,
  });
}
