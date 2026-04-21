/**
 * @swagger
 * tags:
 *   - name: Admin - Profil Payroll
 *     description: Manajemen data profil payroll karyawan.
 * /api/admin/profil-payroll:
 *   get:
 *     summary: Daftar profil payroll
 *     description: Mengambil daftar profil payroll dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Profil Payroll]
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
 *         description: Cari berdasarkan catatan, nama pengguna, email, nomor induk karyawan, jabatan, atau departemen.
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
 *         description: Filter berdasarkan ID user.
 *       - in: query
 *         name: jenis_hubungan_kerja
 *         schema:
 *           type: string
 *           enum: [FREELANCE, INTERNSHIP, PKWT, PKWTT]
 *         description: Filter berdasarkan jenis hubungan kerja.
 *       - in: query
 *         name: id_tarif_pajak_ter
 *         schema:
 *           type: string
 *         description: Filter berdasarkan ID tarif pajak TER.
 *       - in: query
 *         name: payroll_aktif
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *         description: Filter status payroll aktif.
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Isi 1 untuk menyertakan data yang sudah di-soft delete.
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, tanggal_mulai_payroll, jenis_hubungan_kerja, id_tarif_pajak_ter, payroll_aktif]
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
 *         description: Daftar profil payroll berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProfilPayroll'
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
 *     summary: Buat profil payroll
 *     description: Membuat data profil payroll untuk satu user. Jika ditemukan data soft delete untuk user yang sama, endpoint akan memulihkan data tersebut.
 *     tags: [Admin - Profil Payroll]
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
 *               - id_tarif_pajak_ter
 *               - jenis_hubungan_kerja
 *             properties:
 *               id_user:
 *                 type: string
 *                 description: ID user yang akan dibuatkan profil payroll.
 *               id_tarif_pajak_ter:
 *                 type: string
 *                 description: ID tarif pajak TER aktif yang dipakai pada profil payroll.
 *               jenis_hubungan_kerja:
 *                 type: string
 *                 enum: [FREELANCE, INTERNSHIP, PKWT, PKWTT]
 *               payroll_aktif:
 *                 type: boolean
 *                 default: true
 *               tanggal_mulai_payroll:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Data soft delete berhasil dipulihkan dan diperbarui.
 *       '201':
 *         description: Profil payroll berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProfilPayroll'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: User tidak ditemukan.
 *       '409':
 *         description: Profil payroll untuk user tersebut sudah ada.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     ProfilPayrollUserRingkas:
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
 *     ProfilPayroll:
 *       type: object
 *       properties:
 *         id_profil_payroll:
 *           type: string
 *         id_user:
 *           type: string
 *         id_tarif_pajak_ter:
 *           type: string
 *         jenis_hubungan_kerja:
 *           type: string
 *           enum: [FREELANCE, INTERNSHIP, PKWT, PKWTT]
 *         payroll_aktif:
 *           type: boolean
 *         tanggal_mulai_payroll:
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
 *           $ref: '#/components/schemas/ProfilPayrollUserRingkas'
 *         tarif_pajak_ter:
 *           $ref: '#/components/schemas/TarifPajakTERRingkas'
 *     TarifPajakTERRingkas:
 *       type: object
 *       properties:
 *         id_tarif_pajak_ter:
 *           type: string
 *         kode_kategori_pajak:
 *           type: string
 *         penghasilan_dari:
 *           type: number
 *         penghasilan_sampai:
 *           type: number
 *           nullable: true
 *         persen_tarif:
 *           type: number
 *         berlaku_mulai:
 *           type: string
 *           format: date
 *         berlaku_sampai:
 *           type: string
 *           format: date
 *           nullable: true
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

const adminProfilPayrollDocs = {};

export default adminProfilPayrollDocs;
