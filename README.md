# Work Status Dashboard

ระบบ Dashboard สำหรับรายงานสถานะการทำงานของพนักงาน 1 คน ให้หัวหน้าตรวจสอบการเริ่มทำงานและประวัติการอัปโหลดไฟล์ลง Google Drive (รวม Draft)

---

## โครงสร้างโปรเจค

```
StatusPR/
├── frontend/          # React + TailwindCSS
├── backend/           # Node.js + Express + SQLite
├── employee-reporter/ # สคริปต์รันบนเครื่องพนักงาน (ตรวจจับ Premiere Pro)
└── README.md
```

---

## ความต้องการของระบบ

- Node.js 18+
- npm หรือ yarn

---

## 1. ติดตั้ง Backend

```bash
cd backend
npm install
```

สร้างไฟล์ `.env` จากตัวอย่าง:

```bash
copy .env.example .env
```

แก้ไข `.env`:

- `PORT=3001` (หรือพอร์ตที่ต้องการ)
- `GOOGLE_DRIVE_FOLDER_ID` และค่าสำหรับ Google Drive (ดูหัวข้อ "เชื่อมต่อ Google Drive" ด้านล่าง)

เริ่มต้นฐานข้อมูล SQLite:

```bash
npm run init-db
```

รันเซิร์ฟเวอร์:

```bash
npm start
```

หรือโหมดพัฒนา (reload อัตโนมัติ):

```bash
npm run dev
```

Backend จะรันที่ `http://localhost:3001`

---

## 2. ติดตั้ง Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard จะรันที่ `http://localhost:3000` และ proxy ไปยัง Backend อัตโนมัติ

---

## 3. Employee Reporter (เครื่องพนักงาน)

ให้พนักงานรันสคริปต์นี้บนเครื่องที่ใช้ทำงาน (ที่ติดตั้ง Adobe Premiere Pro):

- ส่ง **heartbeat** ไปที่ `POST /api/status/ping` ทุก 30 วินาที (ถ้าไม่มี ping เกิน 2 นาที ระบบจะเปลี่ยนสถานะเป็น Offline อัตโนมัติ)
- ตรวจโฟลเดอร์ **Export** (ค่าเริ่มต้น `C:\VideoExports`) เมื่อมีไฟล์ใหม่ → ส่ง `POST /api/activities/export`
- ถ้า Backend ตั้ง `API_KEY` ไว้ ต้องส่ง header `x-api-key` ทุก request (ตั้งใน Reporter เป็น `STATUS_API_KEY`)

```bash
cd employee-reporter
npm install
```

ถ้า Backend อยู่คนละเครื่อง ให้ตั้งค่า URL:

```bash
set STATUS_API_URL=http://IP_หรือโดเมนของเซิร์ฟเวอร์:3001
node index.js
```

ถ้า Backend ใช้ API Key:

```bash
set STATUS_API_KEY=your_api_key_from_backend_env
```

เปลี่ยนโฟลเดอร์ Export (ค่าเริ่มต้น C:\VideoExports):

```bash
set EXPORT_FOLDER=D:\MyExports
node index.js
```

หรือรันปกติ (Backend ที่ localhost):

```bash
node index.js
```

- สคริปต์ส่ง **ping** ทุก 30 วินาที และตรวจ Premiere Pro ทุก 15 วินาที
- สถานะ: **Working** (Premiere เปิด), **Idle** (Premiere ปิดแต่มี ping), **Offline** (ไม่มี ping เกิน 2 นาที)

---

## 4. เชื่อมต่อ Google Drive API

### 4.1 สร้างโปรเจคและ OAuth ใน Google Cloud

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจคใหม่ หรือเลือกโปรเจคที่มีอยู่
3. เปิด **APIs & Services** → **Library** → ค้นหา **Google Drive API** → เปิดใช้ (Enable)
4. ไปที่ **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
5. ถ้ายังไม่มี OAuth consent screen ให้สร้างแบบ "External" (หรือ Internal ถ้าใช้ Workspace)
6. เลือก Application type: **Web application**
7. ตั้งชื่อและเพิ่ม **Authorized redirect URIs**:
   - `http://localhost:3001/api/drive/callback`
   - ถ้ารันบนเซิร์ฟเวอร์จริง ให้เพิ่ม `https://your-domain.com/api/drive/callback`
8. กด Create แล้วคัดลอก **Client ID** และ **Client secret**

### 4.2 ตั้งค่าใน Backend

ในไฟล์ `backend/.env`:

```env
# แนะนำ “แยกโฟลเดอร์” เพื่อให้ detect เฉพาะงานที่พนักงานอัปโหลด
# - INPUT: หัวหน้าอัปโหลดฟุตเทจ (ระบบจะไม่ต้อง detect)
# - OUTPUT: พนักงานอัปโหลดงาน/ดราฟต์ (ระบบจะ detect โฟลเดอร์นี้)
#
# ใส่เฉพาะโฟลเดอร์ OUTPUT ที่ต้องการให้ระบบ detect
GOOGLE_DRIVE_OUTPUT_FOLDER_ID=รหัสโฟลเดอร์ OUTPUT (พนักงานอัปโหลด)
#
# (Optional) เก็บไว้เป็น reference เฉยๆ ระบบยังไม่อ่านโฟลเดอร์นี้
GOOGLE_DRIVE_INPUT_FOLDER_ID=รหัสโฟลเดอร์ INPUT (หัวหน้าอัปโหลดฟุตเทจ)
#
# (Optional/legacy) ถ้าไม่ใส่ OUTPUT ระบบจะ fallback มาใช้ค่านี้แทน
GOOGLE_DRIVE_FOLDER_ID=รหัสโฟลเดอร์ (fallback)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/drive/callback
```

วิธีหา **Folder ID** ของโฟลเดอร์ใน Google Drive:

- เปิดโฟลเดอร์นั้นในเบราว์เซอร์
- ดูที่ URL เช่น `https://drive.google.com/drive/folders/1ABCxxxYYYzzz`
- ส่วน `1ABCxxxYYYzzz` คือ Folder ID

### 4.3 ทำ OAuth ครั้งแรก

1. ให้ Backend รันอยู่
2. เปิดเบราว์เซอร์ไปที่: `http://localhost:3001/api/drive/auth`
3. ล็อกอิน Google และอนุญาตการเข้าถึง
4. หลัง redirect กลับมา โทเคนจะถูกบันทึกที่ `backend/database/drive-tokens.json`

### 4.4 Sync ไฟล์ที่มีอยู่แล้ว (ครั้งแรกเท่านั้น)

เพื่อไม่ให้ระบบนับไฟล์เก่าในโฟลเดอร์เป็น "อัปโหลดใหม่" ให้รัน sync ครั้งเดียว:

```bash
cd backend
node services/driveSync.js
```

### 4.5 เปิด Drive Watcher (ติดตามไฟล์ใหม่)

รันใน terminal แยก (ขณะที่ Backend ก็รันอยู่):

```bash
cd backend
npm run drive-watch
```

Watcher จะตรวจสอบโฟลเดอร์ทุก 1 นาที และ **รองรับโฟลเดอร์ย่อย (recursive)** เมื่อมีไฟล์ใหม่หรือ Draft (ชื่อเดิม) จะบันทึกลง Activity และ Notification อัตโนมัติ

---

## 5. สรุปการใช้งาน

| ส่วน | คำสั่ง | หมายเหตุ |
|------|--------|----------|
| Backend | `cd backend && npm start` | รัน API และให้ Frontend เรียก |
| Frontend | `cd frontend && npm run dev` | เปิด Dashboard ที่ localhost:3000 |
| Employee Reporter | `cd employee-reporter && node index.js` | รันบนเครื่องพนักงาน |
| Drive Watcher | `cd backend && npm run drive-watch` หรือใส่ `ENABLE_DRIVE_WATCH=1` ใน `.env` แล้วรัน `npm start` | รันคู่กับ Backend เมื่อใช้ Google Drive |

หัวหน้าเปิด **http://localhost:3000** (หรือ URL ของเซิร์ฟเวอร์) เพื่อดู:

- สถานะพนักงาน (กำลังทำงาน / Offline)
- เวลาเริ่มทำงาน และเวลากิจกรรมล่าสุด
- Activity Timeline และตารางกิจกรรม (อัปโหลด / Draft)
- การแจ้งเตือนมุมขวาบน

หน้า Dashboard รีเฟรชข้อมูลอัตโนมัติทุก 10 วินาที

---

## 6. เปลี่ยนชื่อพนักงาน

แก้ไขในฐานข้อมูล SQLite หรือรัน:

```sql
UPDATE employees SET name = 'ชื่อใหม่' WHERE id = 1;
```

หรือเพิ่มสคริปต์ใน Backend สำหรับอัปเดตชื่อผ่าน API ได้ตามต้องการ

---

## License

ใช้ภายในองค์กรได้ตามที่กำหนด
