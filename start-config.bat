@echo off
REM คัดลอกไฟล์นี้เป็น start-config.bat แล้วแก้ค่าให้ตรงเครื่องคุณ
REM copy start-config.example.bat start-config.bat

REM URL ของ Backend (ถ้ารันเครื่องเดียวกัน ใช้ localhost ได้)
set "STATUS_API_URL=http://localhost:3001"

REM API key สำหรับ Employee Reporter (ต้องตรงกับ backend\.env: API_KEY)
REM ถ้า backend ไม่ตั้ง API_KEY สามารถปล่อยว่างได้
set "STATUS_API_KEY="

REM โฟลเดอร์ Export ที่ Employee Reporter จะตรวจจับไฟล์ใหม่
set "EXPORT_FOLDER=C:\VideoExports"

