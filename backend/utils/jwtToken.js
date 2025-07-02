import jwt from 'jsonwebtoken';

export const sendToken = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
    expiresIn: '1d' 
  });
  
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      sex: user.sex,
      photo: user.photo
    }
  });
};