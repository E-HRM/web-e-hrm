/**
 * @swagger
 * tags:
 *   - name: Admin - Jenis Produk Konsultan
 *     description: Manajemen master jenis produk konsultan dari panel admin.
 * /api/admin/produk-konsultan:
 *   get:
 *     summary: Daftar jenis produk konsultan
 *     description: Mengambil daftar jenis produk konsultan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Jenis Produk Konsultan]
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
 *         description: Cari berdasarkan nama produk atau catatan.
 *       - in: query
 *         name: nama_produk
 *         schema:
 *           type: string
 *         description: Filter berdasarkan nama produk.
 *       - in: query
 *         name: aktif
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *         description: Filter status aktif.
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
 *           enum: [created_at, updated_at, nama_produk, persen_share_default, aktif]
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
 *         description: Daftar jenis produk konsultan berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JenisProdukKonsultan'
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
 *     summary: Buat jenis produk konsultan
 *     description: Membuat jenis produk konsultan baru. Jika ditemukan satu data soft delete dengan nama yang sama, data tersebut akan dipulihkan dan diperbarui.
 *     tags: [Admin - Jenis Produk Konsultan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_produk
 *             properties:
 *               nama_produk:
 *                 type: string
 *                 maxLength: 255
 *               persen_share_default:
 *                 type: string
 *                 nullable: true
 *                 example: '10.0000'
 *                 description: Nilai persentase default share, rentang 0 sampai 100.
 *               aktif:
 *                 type: boolean
 *                 default: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Data soft delete berhasil dipulihkan dan diperbarui.
 *       '201':
 *         description: Jenis produk konsultan berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/JenisProdukKonsultan'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Nama produk bentrok dengan data aktif atau beberapa data soft delete berbeda.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     JenisProdukKonsultan:
 *       type: object
 *       properties:
 *         id_jenis_produk_konsultan:
 *           type: string
 *         nama_produk:
 *           type: string
 *         persen_share_default:
 *           type: string
 *           nullable: true
 *           example: '10.0000'
 *         aktif:
 *           type: boolean
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
 */

const adminJenisProdukKonsultanDocs = {};

export default adminJenisProdukKonsultanDocs;
