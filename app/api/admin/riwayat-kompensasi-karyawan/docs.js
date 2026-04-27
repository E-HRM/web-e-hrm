/**
 * @swagger
 * tags:
 *   - name: Admin - Riwayat Kompensasi Karyawan
 *     description: Manajemen riwayat kompensasi karyawan dari panel admin.
 * /api/admin/riwayat-kompensasi-karyawan:
 *   get:
 *     summary: Daftar riwayat kompensasi karyawan
 *     description: Mengambil daftar riwayat kompensasi karyawan dengan filter user, rentang tanggal, pencarian, sorting, dan pagination.
 *     tags: [Admin - Riwayat Kompensasi Karyawan]
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
 *         description: Cari berdasarkan catatan, nama pengguna, email, atau nomor induk karyawan.
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
 *         description: Filter berdasarkan ID user.
 *       - in: query
 *         name: berlakuMulaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `berlaku_mulai`.
 *       - in: query
 *         name: berlakuMulaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `berlaku_mulai`.
 *       - in: query
 *         name: berlakuSampaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `berlaku_sampai`.
 *       - in: query
 *         name: berlakuSampaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `berlaku_sampai`.
 *       - in: query
 *         name: aktifPada
 *         schema:
 *           type: string
 *           format: date
 *         description: Ambil data yang aktif pada tanggal tertentu.
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
 *           enum: [created_at, updated_at, berlaku_mulai, berlaku_sampai, gaji_pokok, tunjangan_jabatan, tunjangan_bpjsk, tunjangan_kesehatan]
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
 *         description: Daftar riwayat kompensasi berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RiwayatKompensasiKaryawan'
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
 *     summary: Buat riwayat kompensasi karyawan
 *     description: Menambahkan riwayat kompensasi baru untuk seorang user. Periode tidak boleh bertabrakan dengan riwayat aktif lain milik user yang sama.
 *     tags: [Admin - Riwayat Kompensasi Karyawan]
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
 *               - berlaku_mulai
 *             properties:
 *               id_user:
 *                 type: string
 *                 description: ID user.
 *               gaji_pokok:
 *                 type: string
 *                 description: Nilai decimal gaji pokok. Default 0 jika tidak dikirim.
 *                 example: '5000000.00'
 *               tunjangan_jabatan:
 *                 type: string
 *                 description: Nilai decimal tunjangan jabatan. Default 0 jika tidak dikirim.
 *                 example: '750000.00'
 *               tunjangan_bpjsk:
 *                 type: string
 *                 description: Nilai decimal tunjangan BPJS Ketenagakerjaan. Default 0 jika tidak dikirim.
 *                 example: '200000.00'
 *               tunjangan_kesehatan:
 *                 type: string
 *                 description: Nilai decimal tunjangan kesehatan. Default 0 jika tidak dikirim.
 *                 example: '300000.00'
 *               berlaku_mulai:
 *                 type: string
 *                 format: date
 *               berlaku_sampai:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Riwayat kompensasi berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RiwayatKompensasiKaryawan'
 *       '400':
 *         description: Payload tidak valid atau periode bertabrakan.
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
 *     RiwayatKompensasiKaryawanUserRingkas:
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
 *     RiwayatKompensasiKaryawan:
 *       type: object
 *       properties:
 *         id_riwayat_kompensasi:
 *           type: string
 *         id_user:
 *           type: string
 *         gaji_pokok:
 *           type: string
 *           example: '5000000.00'
 *         tunjangan_jabatan:
 *           type: string
 *           example: '750000.00'
 *         tunjangan_bpjsk:
 *           type: string
 *           example: '200000.00'
 *         tunjangan_kesehatan:
 *           type: string
 *           example: '300000.00'
 *         berlaku_mulai:
 *           type: string
 *           format: date
 *         berlaku_sampai:
 *           type: string
 *           format: date
 *           nullable: true
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
 *           $ref: '#/components/schemas/RiwayatKompensasiKaryawanUserRingkas'
 */

const adminRiwayatKompensasiKaryawanDocs = {};

export default adminRiwayatKompensasiKaryawanDocs;
