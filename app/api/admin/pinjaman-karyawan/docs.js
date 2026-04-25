/**
 * @swagger
 * tags:
 *   - name: Admin - Pinjaman Karyawan
 *     description: Manajemen data pinjaman karyawan dari panel admin.
 * /api/admin/pinjaman-karyawan:
 *   get:
 *     summary: Daftar pinjaman karyawan
 *     description: Mengambil daftar pinjaman karyawan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Nomor halaman.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah data per halaman.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama pinjaman, catatan, nama pengguna, email, atau NIK.
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
 *         description: Filter berdasarkan ID user.
 *       - in: query
 *         name: status_pinjaman
 *         schema:
 *           type: string
 *           enum: [DRAFT, AKTIF, LUNAS, DIBATALKAN]
 *         description: Filter berdasarkan status pinjaman.
 *       - in: query
 *         name: tanggalMulaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `tanggal_mulai`.
 *       - in: query
 *         name: tanggalMulaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `tanggal_mulai`.
 *       - in: query
 *         name: tanggalSelesaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `tanggal_selesai`.
 *       - in: query
 *         name: tanggalSelesaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `tanggal_selesai`.
 *       - in: query
 *         name: aktifPada
 *         schema:
 *           type: string
 *           format: date
 *         description: Ambil pinjaman yang periodenya aktif pada tanggal tertentu.
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Isi 1 untuk menyertakan data yang sudah di-soft delete.
 *       - in: query
 *         name: deletedOnly
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Isi 1 untuk hanya mengambil data yang sudah di-soft delete.
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, nama_pinjaman, nominal_pinjaman, tenor_bulan, sisa_saldo, tanggal_mulai, tanggal_selesai, status_pinjaman]
 *           default: created_at
 *         description: Kolom pengurutan.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Arah pengurutan.
 *     responses:
 *       '200':
 *         description: Daftar pinjaman karyawan berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PinjamanKaryawan'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '400':
 *         description: Parameter query tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat pinjaman karyawan
 *     description: |
 *       Membuat data pinjaman karyawan baru dengan status pengajuan yang dapat dipilih. Logic bisnis yang diterapkan:
 *       - status `DRAFT` dan `DIBATALKAN` disimpan tanpa generate cicilan.
 *       - status `AKTIF` akan langsung membentuk cicilan bulanan mulai dari `tanggal_mulai`.
 *       - nominal cicilan terakhir akan disesuaikan agar total tagihan sama persis dengan `nominal_pinjaman`.
 *       - `tanggal_selesai` akan mengikuti jatuh tempo cicilan terakhir hanya saat status `AKTIF`.
 *       - status `LUNAS` tidak diterima pada saat create.
 *     tags: [Admin - Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_user
 *               - nama_pinjaman
 *               - nominal_pinjaman
 *               - tenor_bulan
 *               - tanggal_mulai
 *             properties:
 *               id_user:
 *                 type: string
 *               nama_pinjaman:
 *                 type: string
 *                 maxLength: 255
 *               nominal_pinjaman:
 *                 type: string
 *                 example: '10000000.00'
 *               tenor_bulan:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               status_pinjaman:
 *                 type: string
 *                 enum: [DRAFT, AKTIF, DIBATALKAN]
 *                 description: Default `DRAFT` jika tidak dikirim. Cicilan hanya digenerate saat status `AKTIF`.
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Pinjaman karyawan berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PinjamanKaryawan'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: User tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     PinjamanKaryawanUserRingkas:
 *       type: object
 *       properties:
 *         id_user:
 *           type: string
 *         nama_pengguna:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         nomor_induk_karyawan:
 *           type: string
 *           nullable: true
 *         status_kerja:
 *           type: string
 *           nullable: true
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         departement:
 *           type: object
 *           nullable: true
 *           properties:
 *             id_departement:
 *               type: string
 *             nama_departement:
 *               type: string
 *         jabatan:
 *           type: object
 *           nullable: true
 *           properties:
 *             id_jabatan:
 *               type: string
 *             nama_jabatan:
 *               type: string
 *         kantor:
 *           type: object
 *           nullable: true
 *           properties:
 *             id_location:
 *               type: string
 *             nama_kantor:
 *               type: string
 *     PinjamanKaryawan:
 *       type: object
 *       properties:
 *         id_pinjaman_karyawan:
 *           type: string
 *         id_user:
 *           type: string
 *         nama_pinjaman:
 *           type: string
 *         nominal_pinjaman:
 *           type: string
 *           example: '10000000.00'
 *         tenor_bulan:
 *           type: integer
 *           example: 10
 *         nominal_cicilan:
 *           type: string
 *           description: Nilai hasil hitung `nominal_pinjaman / tenor_bulan`, bukan kolom database.
 *           example: '1000000.00'
 *         sisa_saldo:
 *           type: string
 *           example: '7000000.00'
 *         tanggal_mulai:
 *           type: string
 *           format: date
 *         tanggal_selesai:
 *           type: string
 *           format: date
 *           nullable: true
 *         status_pinjaman:
 *           type: string
 *           enum: [DRAFT, AKTIF, LUNAS, DIBATALKAN]
 *         catatan:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         user:
 *           $ref: '#/components/schemas/PinjamanKaryawanUserRingkas'
 *         _count:
 *           type: object
 *           properties:
 *             cicilan:
 *               type: integer
 */

const adminPinjamanKaryawanDocs = {};

export default adminPinjamanKaryawanDocs;
