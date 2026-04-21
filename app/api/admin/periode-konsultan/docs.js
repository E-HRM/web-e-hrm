/**
 * @swagger
 * tags:
 *   - name: Admin - Periode Konsultan
 *     description: Manajemen periode konsultan dari panel admin.
 * /api/admin/periode-konsultan:
 *   get:
 *     summary: Daftar periode konsultan
 *     description: Mengambil daftar periode konsultan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Periode Konsultan]
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
 *         description: Cari berdasarkan nama bulan atau catatan.
 *       - in: query
 *         name: tahun
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 9999
 *         description: Filter berdasarkan tahun.
 *       - in: query
 *         name: bulan
 *         schema:
 *           type: string
 *           enum: [JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER]
 *         description: Filter berdasarkan bulan.
 *       - in: query
 *         name: status_periode
 *         schema:
 *           type: string
 *           enum: [DRAFT, DIREVIEW, DISETUJUI, TERKUNCI]
 *         description: Filter berdasarkan status periode.
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
 *         description: Ambil periode yang mencakup tanggal tertentu.
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
 *           enum: [created_at, updated_at, tahun, bulan, tanggal_mulai, tanggal_selesai, status_periode]
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
 *         description: Daftar periode konsultan berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PeriodeKonsultan'
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
 *     summary: Buat periode konsultan
 *     description: Membuat periode konsultan baru. Jika ditemukan data soft delete dengan kombinasi `tahun` dan `bulan` yang sama, data akan dipulihkan dan diperbarui.
 *     tags: [Admin - Periode Konsultan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tahun
 *               - bulan
 *               - tanggal_mulai
 *               - tanggal_selesai
 *             properties:
 *               tahun:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 9999
 *               bulan:
 *                 type: string
 *                 enum: [JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER]
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *               status_periode:
 *                 type: string
 *                 enum: [DRAFT, DIREVIEW, DISETUJUI, TERKUNCI]
 *                 default: DRAFT
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Data soft delete berhasil dipulihkan dan diperbarui.
 *       '201':
 *         description: Periode konsultan berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PeriodeKonsultan'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Kombinasi tahun dan bulan sudah digunakan oleh data aktif lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     PeriodeKonsultan:
 *       type: object
 *       properties:
 *         id_periode_konsultan:
 *           type: string
 *         tahun:
 *           type: integer
 *         bulan:
 *           type: string
 *           enum: [JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER]
 *         tanggal_mulai:
 *           type: string
 *           format: date
 *         tanggal_selesai:
 *           type: string
 *           format: date
 *         status_periode:
 *           type: string
 *           enum: [DRAFT, DIREVIEW, DISETUJUI, TERKUNCI]
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
 *         _count:
 *           type: object
 *           properties:
 *             transaksi_konsultan:
 *               type: integer
 *             payout_konsultan:
 *               type: integer
 */

const adminPeriodeKonsultanDocs = {};

export default adminPeriodeKonsultanDocs;
