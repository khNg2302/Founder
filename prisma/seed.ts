import { PrismaPg } from '@prisma/adapter-pg';

import { env } from 'node:process';
import argon2 from 'argon2';
import { PrismaClient } from 'generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const NOW = new Date('2026-09-10T00:00:00.000Z');

async function main() {
  console.log('========================================');
  console.log('START DATABASE SEED');
  console.log('========================================');

  /*
   * ============================================================
   * 1. CATEGORY
   * ============================================================
   */

  const categories = {
    fieldTech: await prisma.category.upsert({
      where: { id: 'cat_field_tech' },
      update: {
        name: 'Công nghệ',
        type: 'FIELD',
        parentId: null,
      },
      create: {
        id: 'cat_field_tech',
        name: 'Công nghệ',
        type: 'FIELD',
      },
    }),

    fieldBusiness: await prisma.category.upsert({
      where: { id: 'cat_field_business' },
      update: {
        name: 'Kinh doanh',
        type: 'FIELD',
        parentId: null,
      },
      create: {
        id: 'cat_field_business',
        name: 'Kinh doanh',
        type: 'FIELD',
      },
    }),

    fieldEducation: await prisma.category.upsert({
      where: { id: 'cat_field_education' },
      update: {
        name: 'Giáo dục',
        type: 'FIELD',
        parentId: null,
      },
      create: {
        id: 'cat_field_education',
        name: 'Giáo dục',
        type: 'FIELD',
      },
    }),
  };

  const categoriesChild = {
    industrySoftware: await prisma.category.upsert({
      where: { id: 'cat_ind_software' },
      update: {
        name: 'Phần mềm',
        type: 'INDUSTRY',
        parentId: categories.fieldTech.id,
      },
      create: {
        id: 'cat_ind_software',
        name: 'Phần mềm',
        type: 'INDUSTRY',
        parentId: categories.fieldTech.id,
      },
    }),

    industryHardware: await prisma.category.upsert({
      where: { id: 'cat_ind_hardware' },
      update: {
        name: 'Phần cứng',
        type: 'INDUSTRY',
        parentId: categories.fieldTech.id,
      },
      create: {
        id: 'cat_ind_hardware',
        name: 'Phần cứng',
        type: 'INDUSTRY',
        parentId: categories.fieldTech.id,
      },
    }),

    industryEcommerce: await prisma.category.upsert({
      where: { id: 'cat_ind_ecommerce' },
      update: {
        name: 'Thương mại điện tử',
        type: 'INDUSTRY',
        parentId: categories.fieldBusiness.id,
      },
      create: {
        id: 'cat_ind_ecommerce',
        name: 'Thương mại điện tử',
        type: 'INDUSTRY',
        parentId: categories.fieldBusiness.id,
      },
    }),

    industryEdtech: await prisma.category.upsert({
      where: { id: 'cat_ind_edtech' },
      update: {
        name: 'EdTech',
        type: 'INDUSTRY',
        parentId: categories.fieldEducation.id,
      },
      create: {
        id: 'cat_ind_edtech',
        name: 'EdTech',
        type: 'INDUSTRY',
        parentId: categories.fieldEducation.id,
      },
    }),
  };

  const niches = {
    nicheWeb: await prisma.category.upsert({
      where: { id: 'cat_niche_web' },
      update: {
        name: 'Web Development',
        type: 'NICHE',
        parentId: categoriesChild.industrySoftware.id,
      },
      create: {
        id: 'cat_niche_web',
        name: 'Web Development',
        type: 'NICHE',
        parentId: categoriesChild.industrySoftware.id,
      },
    }),

    nicheAI: await prisma.category.upsert({
      where: { id: 'cat_niche_ai' },
      update: {
        name: 'AI',
        type: 'NICHE',
        parentId: categoriesChild.industrySoftware.id,
      },
      create: {
        id: 'cat_niche_ai',
        name: 'AI',
        type: 'NICHE',
        parentId: categoriesChild.industrySoftware.id,
      },
    }),
  };

  console.log('✓ Categories');

  /*
   * ============================================================
   * 2. LOCATIONS
   * ============================================================
   */

  const vietnam = await prisma.location.upsert({
    where: { id: 'loc_vietnam' },
    update: {
      name: 'Việt Nam',
      type: 'COUNTRY',
      parentId: null,
    },
    create: {
      id: 'loc_vietnam',
      name: 'Việt Nam',
      type: 'COUNTRY',
    },
  });

  const hcm = await prisma.location.upsert({
    where: { id: 'loc_hcm' },
    update: {
      name: 'Thành phố Hồ Chí Minh',
      type: 'PROVINCE',
      parentId: vietnam.id,
    },
    create: {
      id: 'loc_hcm',
      name: 'Thành phố Hồ Chí Minh',
      type: 'PROVINCE',
      parentId: vietnam.id,
    },
  });

  const tienGiang = await prisma.location.upsert({
    where: { id: 'loc_tiengiang' },
    update: {
      name: 'Tiền Giang',
      type: 'PROVINCE',
      parentId: vietnam.id,
    },
    create: {
      id: 'loc_tiengiang',
      name: 'Tiền Giang',
      type: 'PROVINCE',
      parentId: vietnam.id,
    },
  });

  const myTho = await prisma.location.upsert({
    where: { id: 'loc_mytho' },
    update: {
      name: 'Mỹ Tho',
      type: 'CITY',
      parentId: tienGiang.id,
    },
    create: {
      id: 'loc_mytho',
      name: 'Mỹ Tho',
      type: 'CITY',
      parentId: tienGiang.id,
    },
  });

  console.log('✓ Locations');

  /*
   * ============================================================
   * 3. AUDIENCE TYPES
   * ============================================================
   */

  const audienceFounder = await prisma.audienceType.upsert({
    where: { id: 'aud_founder' },
    update: {
      name: 'Founder',
      description: 'Người sáng lập hoặc đồng sáng lập dự án',
      active: true,
    },
    create: {
      id: 'aud_founder',
      name: 'Founder',
      description: 'Người sáng lập hoặc đồng sáng lập dự án',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const audienceDeveloper = await prisma.audienceType.upsert({
    where: { id: 'aud_developer' },
    update: {
      name: 'Developer',
      description: 'Người phát triển phần mềm',
      active: true,
    },
    create: {
      id: 'aud_developer',
      name: 'Developer',
      description: 'Người phát triển phần mềm',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const audienceDesigner = await prisma.audienceType.upsert({
    where: { id: 'aud_designer' },
    update: {
      name: 'Designer',
      description: 'Người làm thiết kế',
      active: true,
    },
    create: {
      id: 'aud_designer',
      name: 'Designer',
      description: 'Người làm thiết kế',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const audienceInvestor = await prisma.audienceType.upsert({
    where: { id: 'aud_investor' },
    update: {
      name: 'Investor',
      description: 'Nhà đầu tư',
      active: true,
    },
    create: {
      id: 'aud_investor',
      name: 'Investor',
      description: 'Nhà đầu tư',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const audienceStudent = await prisma.audienceType.upsert({
    where: { id: 'aud_student' },
    update: {
      name: 'Student',
      description: 'Sinh viên hoặc người đang học tập',
      active: true,
    },
    create: {
      id: 'aud_student',
      name: 'Student',
      description: 'Sinh viên hoặc người đang học tập',
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Audience types');

  /*
   * ============================================================
   * 4. USERS
   * ============================================================
   */

  const founder = await prisma.user.upsert({
    where: { id: 'usr_founder_001' },
    update: {
      fullName: 'Nguyễn Minh Founder',
      nickname: 'minhfounder',
      ageRange: 'AGE_25_34',
      status: 'ACTIVE',
    },
    create: {
      id: 'usr_founder_001',
      fullName: 'Nguyễn Minh Founder',
      nickname: 'minhfounder',
      ageRange: 'AGE_25_34',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const developer = await prisma.user.upsert({
    where: { id: 'usr_developer_01' },
    update: {
      fullName: 'Trần Minh Developer',
      nickname: 'mindev',
      ageRange: 'AGE_25_34',
      status: 'ACTIVE',
    },
    create: {
      id: 'usr_developer_01',
      fullName: 'Trần Minh Developer',
      nickname: 'mindev',
      ageRange: 'AGE_25_34',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const designer = await prisma.user.upsert({
    where: { id: 'usr_designer_001' },
    update: {
      fullName: 'Lê Anh Designer',
      nickname: 'anhdesign',
      ageRange: 'AGE_18_24',
      status: 'ACTIVE',
    },
    create: {
      id: 'usr_designer_001',
      fullName: 'Lê Anh Designer',
      nickname: 'anhdesign',
      ageRange: 'AGE_18_24',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const investor = await prisma.user.upsert({
    where: { id: 'usr_investor_001' },
    update: {
      fullName: 'Phạm Anh Investor',
      nickname: 'phaminvest',
      ageRange: 'AGE_35_44',
      status: 'ACTIVE',
    },
    create: {
      id: 'usr_investor_001',
      fullName: 'Phạm Anh Investor',
      nickname: 'phaminvest',
      ageRange: 'AGE_35_44',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Users');

  /*
   * ============================================================
   * 5. ROLES
   * ============================================================
   */

  const roleUser = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {
      description: 'Người dùng thông thường',
    },
    create: {
      id: 'role_user',
      name: 'USER',
      description: 'Người dùng thông thường',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      description: 'Quản trị viên',
    },
    create: {
      id: 'role_admin',
      name: 'ADMIN',
      description: 'Quản trị viên',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Roles');

  /*
   * ============================================================
   * 6. PERMISSIONS
   * ============================================================
   */

  const permissionNames = [
    'PROJECT_READ',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'USER_READ',
    'USER_UPDATE',
    'ASSESSMENT_READ',
    'ASSESSMENT_MANAGE',
  ];

  const permissions: Record<string, { id: string }> = {};

  for (const name of permissionNames) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        id: `perm_${name.toLowerCase()}`,
        name,
        description: `Permission ${name}`,
        createdAt: NOW,
        updatedAt: NOW,
      },
      select: {
        id: true,
      },
    });

    permissions[name] = permission;
  }

  console.log('✓ Permissions');

  /*
   * ============================================================
   * 7. ROLE PERMISSIONS
   * ============================================================
   */

  const userPermissions = [
    'PROJECT_READ',
    'PROJECT_CREATE',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'USER_READ',
    'USER_UPDATE',
    'ASSESSMENT_READ',
  ];

  for (const name of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleUser.id,
          permissionId: permissions[name].id,
        },
      },
      update: {},
      create: {
        roleId: roleUser.id,
        permissionId: permissions[name].id,
      },
    });
  }

  for (const name of permissionNames) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleAdmin.id,
          permissionId: permissions[name].id,
        },
      },
      update: {},
      create: {
        roleId: roleAdmin.id,
        permissionId: permissions[name].id,
      },
    });
  }

  console.log('✓ Role permissions');

  /*
   * ============================================================
   * 8. USER ROLES
   * ============================================================
   */

  const userRoleData = [
    {
      userId: founder.id,
      roleId: roleUser.id,
    },
    {
      userId: developer.id,
      roleId: roleUser.id,
    },
    {
      userId: designer.id,
      roleId: roleUser.id,
    },
    {
      userId: investor.id,
      roleId: roleAdmin.id,
    },
  ];

  for (const item of userRoleData) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: item,
      },
      update: {},
      create: item,
    });
  }

  console.log('✓ User roles');

  /*
   * ============================================================
   * 9. ACCOUNTS
   * ============================================================
   */

  const passwordHash = await argon2.hash('Password@123');

  const founderAccount = await prisma.account.upsert({
    where: {
      provider_email: {
        provider: 'LOCAL',
        email: 'founder@example.com',
      },
    },
    update: {
      userId: founder.id,
      passwordHash,
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: NOW,
    },
    create: {
      id: 'acc_founder_001',
      userId: founder.id,
      provider: 'LOCAL',
      providerAccountId: 'founder@example.com',
      email: 'founder@example.com',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const developerAccount = await prisma.account.upsert({
    where: {
      provider_email: {
        provider: 'LOCAL',
        email: 'developer@example.com',
      },
    },
    update: {
      userId: developer.id,
      passwordHash,
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: NOW,
    },
    create: {
      id: 'acc_developer_01',
      userId: developer.id,
      provider: 'LOCAL',
      providerAccountId: 'developer@example.com',
      email: 'developer@example.com',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const designerAccount = await prisma.account.upsert({
    where: {
      provider_email: {
        provider: 'LOCAL',
        email: 'designer@example.com',
      },
    },
    update: {
      userId: designer.id,
      passwordHash,
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: NOW,
    },
    create: {
      id: 'acc_designer_001',
      userId: designer.id,
      provider: 'LOCAL',
      providerAccountId: 'designer@example.com',
      email: 'designer@example.com',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const investorAccount = await prisma.account.upsert({
    where: {
      provider_email: {
        provider: 'LOCAL',
        email: 'investor@example.com',
      },
    },
    update: {
      userId: investor.id,
      passwordHash,
      status: 'ACTIVE',
      deletedAt: null,
      emailVerifiedAt: NOW,
    },
    create: {
      id: 'acc_investor_001',
      userId: investor.id,
      provider: 'LOCAL',
      providerAccountId: 'investor@example.com',
      email: 'investor@example.com',
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Accounts');

  /*
   * ============================================================
   * 10. USER CATEGORY
   * ============================================================
   */

  const userCategories = [
    {
      id: 'ucat_founder_tech',
      userId: founder.id,
      categoryId: categories.fieldTech.id,
    },
    {
      id: 'ucat_founder_business',
      userId: founder.id,
      categoryId: categories.fieldBusiness.id,
    },
    {
      id: 'ucat_dev_tech',
      userId: developer.id,
      categoryId: categories.fieldTech.id,
    },
    {
      id: 'ucat_dev_web',
      userId: developer.id,
      categoryId: niches.nicheWeb.id,
    },
    {
      id: 'ucat_design_tech',
      userId: designer.id,
      categoryId: categories.fieldTech.id,
    },
    {
      id: 'ucat_invest_business',
      userId: investor.id,
      categoryId: categories.fieldBusiness.id,
    },
  ];

  for (const item of userCategories) {
    await prisma.userCategory.upsert({
      where: {
        uk_user_category: {
          userId: item.userId,
          categoryId: item.categoryId,
        },
      },
      update: {},
      create: item,
    });
  }

  console.log('✓ User categories');

  /*
   * ============================================================
   * 11. USER AUDIENCES
   * ============================================================
   */

  const userAudiences = [
    {
      id: 'ua_founder',
      userId: founder.id,
      audienceTypeId: audienceFounder.id,
    },
    {
      id: 'ua_dev',
      userId: developer.id,
      audienceTypeId: audienceDeveloper.id,
    },
    {
      id: 'ua_designer',
      userId: designer.id,
      audienceTypeId: audienceDesigner.id,
    },
    {
      id: 'ua_investor',
      userId: investor.id,
      audienceTypeId: audienceInvestor.id,
    },
  ];

  for (const item of userAudiences) {
    await prisma.userAudience.upsert({
      where: {
        uk_user_audience: {
          userId: item.userId,
          audienceTypeId: item.audienceTypeId,
        },
      },
      update: {},
      create: item,
    });
  }

  /*
   * Student audience also assigned to developer.
   */

  await prisma.userAudience.upsert({
    where: {
      uk_user_audience: {
        userId: developer.id,
        audienceTypeId: audienceStudent.id,
      },
    },
    update: {},
    create: {
      id: 'ua_dev_student',
      userId: developer.id,
      audienceTypeId: audienceStudent.id,
    },
  });

  console.log('✓ User audiences');

  /*
   * ============================================================
   * 12. CONTRIBUTIONS
   * ============================================================
   */

  const contributionFrontend = await prisma.contribution.upsert({
    where: {
      uk_contribution_field_name: {
        fieldId: categories.fieldTech.id,
        name: 'Frontend Development',
      },
    },
    update: {
      description: 'Phát triển giao diện và trải nghiệm phía frontend',
    },
    create: {
      id: 'contrib_frontend',
      fieldId: categories.fieldTech.id,
      name: 'Frontend Development',
      description: 'Phát triển giao diện và trải nghiệm phía frontend',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const contributionBackend = await prisma.contribution.upsert({
    where: {
      uk_contribution_field_name: {
        fieldId: categories.fieldTech.id,
        name: 'Backend Development',
      },
    },
    update: {
      description: 'Phát triển API, business logic và hệ thống backend',
    },
    create: {
      id: 'contrib_backend',
      fieldId: categories.fieldTech.id,
      name: 'Backend Development',
      description: 'Phát triển API, business logic và hệ thống backend',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const contributionUIUX = await prisma.contribution.upsert({
    where: {
      uk_contribution_field_name: {
        fieldId: categories.fieldTech.id,
        name: 'UI/UX Design',
      },
    },
    update: {
      description: 'Thiết kế giao diện và trải nghiệm người dùng',
    },
    create: {
      id: 'contrib_uiux',
      fieldId: categories.fieldTech.id,
      name: 'UI/UX Design',
      description: 'Thiết kế giao diện và trải nghiệm người dùng',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const contributionBusiness = await prisma.contribution.upsert({
    where: {
      uk_contribution_field_name: {
        fieldId: categories.fieldBusiness.id,
        name: 'Business Development',
      },
    },
    update: {
      description: 'Phát triển kinh doanh và quan hệ đối tác',
    },
    create: {
      id: 'contrib_business',
      fieldId: categories.fieldBusiness.id,
      name: 'Business Development',
      description: 'Phát triển kinh doanh và quan hệ đối tác',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Contributions');

  /*
   * ============================================================
   * 13. USER CONTRIBUTIONS
   * ============================================================
   */

  const userContributionFrontend = await prisma.userContribution.upsert({
    where: {
      uk_user_contribution: {
        userId: developer.id,
        contributionId: contributionFrontend.id,
      },
    },
    update: {
      description: 'Có kinh nghiệm phát triển ReactJS, Next.js và TypeScript',
    },
    create: {
      id: 'ucontrib_dev_front',
      userId: developer.id,
      contributionId: contributionFrontend.id,
      description: 'Có kinh nghiệm phát triển ReactJS, Next.js và TypeScript',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const userContributionBackend = await prisma.userContribution.upsert({
    where: {
      uk_user_contribution: {
        userId: developer.id,
        contributionId: contributionBackend.id,
      },
    },
    update: {
      description: 'Có kinh nghiệm xây dựng REST API và PostgreSQL',
    },
    create: {
      id: 'ucontrib_dev_back',
      userId: developer.id,
      contributionId: contributionBackend.id,
      description: 'Có kinh nghiệm xây dựng REST API và PostgreSQL',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const userContributionUIUX = await prisma.userContribution.upsert({
    where: {
      uk_user_contribution: {
        userId: designer.id,
        contributionId: contributionUIUX.id,
      },
    },
    update: {
      description: 'Thiết kế UI/UX cho web application',
    },
    create: {
      id: 'ucontrib_design',
      userId: designer.id,
      contributionId: contributionUIUX.id,
      description: 'Thiết kế UI/UX cho web application',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const userContributionBusiness = await prisma.userContribution.upsert({
    where: {
      uk_user_contribution: {
        userId: founder.id,
        contributionId: contributionBusiness.id,
      },
    },
    update: {
      description: 'Phát triển business và kết nối đối tác',
    },
    create: {
      id: 'ucontrib_founder_biz',
      userId: founder.id,
      contributionId: contributionBusiness.id,
      description: 'Phát triển business và kết nối đối tác',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ User contributions');

  /*
   * ============================================================
   * 14. EXPERIENCES
   * ============================================================
   */

  await prisma.experience.upsert({
    where: { id: 'exp_dev_frontend' },
    update: {
      title: 'Frontend Developer',
      description: 'Phát triển SaaS application bằng ReactJS và Next.js',
      durationValue: 3,
      durationUnit: 'YEAR',
      contributionId: contributionFrontend.id,
    },
    create: {
      id: 'exp_dev_frontend',
      userId: developer.id,
      contributionId: contributionFrontend.id,
      title: 'Frontend Developer',
      description: 'Phát triển SaaS application bằng ReactJS và Next.js',
      durationValue: 3,
      durationUnit: 'YEAR',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.experience.upsert({
    where: { id: 'exp_dev_backend' },
    update: {
      title: 'Backend Developer',
      description: 'Xây dựng REST API và database',
      durationValue: 2,
      durationUnit: 'YEAR',
      contributionId: contributionBackend.id,
    },
    create: {
      id: 'exp_dev_backend',
      userId: developer.id,
      contributionId: contributionBackend.id,
      title: 'Backend Developer',
      description: 'Xây dựng REST API và database',
      durationValue: 2,
      durationUnit: 'YEAR',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.experience.upsert({
    where: { id: 'exp_designer_uiux' },
    update: {
      title: 'UI/UX Designer',
      description: 'Thiết kế giao diện web application',
      durationValue: 2,
      durationUnit: 'YEAR',
      contributionId: contributionUIUX.id,
    },
    create: {
      id: 'exp_designer_uiux',
      userId: designer.id,
      contributionId: contributionUIUX.id,
      title: 'UI/UX Designer',
      description: 'Thiết kế giao diện web application',
      durationValue: 2,
      durationUnit: 'YEAR',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Experiences');

  /*
   * ============================================================
   * 15. PROJECT
   * ============================================================
   */

  const project = await prisma.project.upsert({
    where: { id: 'project_founder_demo' },
    update: {
      name: 'Founder Collaboration Platform',
      description:
        'Nền tảng kết nối Founder với người có năng lực và nguồn lực phù hợp',
      scope: 'NATIONAL',
      stage: 'MVP',
      activityStatus: 'IN_PROGRESS',
      createdById: founder.id,
      investmentGoal: 'Xây dựng và phát triển MVP',
    },
    create: {
      id: 'project_founder_demo',
      name: 'Founder Collaboration Platform',
      description:
        'Nền tảng kết nối Founder với người có năng lực và nguồn lực phù hợp',
      scope: 'NATIONAL',
      stage: 'MVP',
      activityStatus: 'IN_PROGRESS',
      createdById: founder.id,
      investmentGoal: 'Xây dựng và phát triển MVP',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Project');

  /*
   * ============================================================
   * 16. PROJECT CATEGORIES
   * ============================================================
   */

  const projectCategories = [
    {
      projectId: project.id,
      categoryId: categories.fieldTech.id,
    },
    {
      projectId: project.id,
      categoryId: categoriesChild.industrySoftware.id,
    },
    {
      projectId: project.id,
      categoryId: niches.nicheWeb.id,
    },
  ];

  for (const item of projectCategories) {
    await prisma.projectCategory.upsert({
      where: {
        uk_project_category: item,
      },
      update: {},
      create: item,
    });
  }

  console.log('✓ Project categories');

  /*
   * ============================================================
   * 17. PROJECT AUDIENCES
   * ============================================================
   */

  const projectAudiences = [
    {
      id: 'pa_founder',
      projectId: project.id,
      audienceTypeId: audienceFounder.id,
    },
    {
      id: 'pa_developer',
      projectId: project.id,
      audienceTypeId: audienceDeveloper.id,
    },
    {
      id: 'pa_designer',
      projectId: project.id,
      audienceTypeId: audienceDesigner.id,
    },
    {
      id: 'pa_investor',
      projectId: project.id,
      audienceTypeId: audienceInvestor.id,
    },
  ];

  for (const item of projectAudiences) {
    await prisma.projectAudience.upsert({
      where: {
        uk_project_audience: {
          projectId: item.projectId,
          audienceTypeId: item.audienceTypeId,
        },
      },
      update: {},
      create: item,
    });
  }

  console.log('✓ Project audiences');

  /*
   * ============================================================
   * 18. PROJECT LOCATIONS
   * ============================================================
   */

  const projectLocationVietnam = await prisma.projectLocation.upsert({
    where: {
      uk_project_location: {
        projectId: project.id,
        locationId: vietnam.id,
      },
    },
    update: {
      detailLocation: null,
    },
    create: {
      id: 'pl_project_vietnam',
      projectId: project.id,
      locationId: vietnam.id,
    },
  });

  await prisma.projectLocation.upsert({
    where: {
      uk_project_location: {
        projectId: project.id,
        locationId: hcm.id,
      },
    },
    update: {
      detailLocation: 'Khu vực TP. Hồ Chí Minh',
    },
    create: {
      id: 'pl_project_hcm',
      projectId: project.id,
      locationId: hcm.id,
      detailLocation: 'Khu vực TP. Hồ Chí Minh',
    },
  });

  console.log('✓ Project locations');

  /*
   * ============================================================
   * 19. PROJECT STATUS INDICATORS
   * ============================================================
   */

  await prisma.projectStatusIndicator.upsert({
    where: {
      uk_project_status_indicator: {
        projectId: project.id,
        status: 'YES',
        term: 'Có MVP',
      },
    },
    update: {},
    create: {
      id: 'psi_project_mvp',
      projectId: project.id,
      status: 'YES',
      term: 'Có MVP',
    },
  });

  await prisma.projectStatusIndicator.upsert({
    where: {
      uk_project_status_indicator: {
        projectId: project.id,
        status: 'YES',
        term: 'Có Founder',
      },
    },
    update: {},
    create: {
      id: 'psi_project_founder',
      projectId: project.id,
      status: 'YES',
      term: 'Có Founder',
    },
  });

  console.log('✓ Project status indicators');

  /*
   * ============================================================
   * 20. HUMAN REQUIREMENT
   * ============================================================
   */

  const requirement = await prisma.humanRequirement.upsert({
    where: { id: 'hr_project_developer' },
    update: {
      title: 'Tìm Frontend Developer',
      participationPeriodType: 'DURATION',
      participationDurationValue: 6,
      participationDurationUnit: 'MONTH',
      participationForm: 'Remote hoặc hybrid',
    },
    create: {
      id: 'hr_project_developer',
      projectId: project.id,
      title: 'Tìm Frontend Developer',
      participationPeriodType: 'DURATION',
      participationDurationValue: 6,
      participationDurationUnit: 'MONTH',
      participationForm: 'Remote hoặc hybrid',
    },
  });

  console.log('✓ Human requirement');

  /*
   * ============================================================
   * 21. HUMAN CRITERIA
   * ============================================================
   */

  await prisma.humanCriterion.upsert({
    where: {
      uk_human_criterion: {
        humanRequirementId: requirement.id,
        status: 'YES',
        term: 'Có kinh nghiệm ReactJS',
      },
    },
    update: {},
    create: {
      id: 'hc_react',
      humanRequirementId: requirement.id,
      status: 'YES',
      term: 'Có kinh nghiệm ReactJS',
    },
  });

  await prisma.humanCriterion.upsert({
    where: {
      uk_human_criterion: {
        humanRequirementId: requirement.id,
        status: 'YES',
        term: 'Biết TypeScript',
      },
    },
    update: {},
    create: {
      id: 'hc_typescript',
      humanRequirementId: requirement.id,
      status: 'YES',
      term: 'Biết TypeScript',
    },
  });

  console.log('✓ Human criteria');

  /*
   * ============================================================
   * 22. ASSESSMENT
   * ============================================================
   */

  const assessment = await prisma.assessment.upsert({
    where: {
      uk_assessment_contribution_version: {
        contributionId: contributionFrontend.id,
        version: 1,
      },
    },
    update: {
      name: 'Frontend Development Assessment',
      passingScore: 70,
    },
    create: {
      id: 'assessment_front_v1',
      contributionId: contributionFrontend.id,
      name: 'Frontend Development Assessment',
      version: 1,
      passingScore: 70,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Assessment');

  /*
   * ============================================================
   * 23. QUESTIONS + OPTIONS
   * ============================================================
   */

  const question1 = await prisma.assessmentQuestion.upsert({
    where: {
      uk_assessment_question_order: {
        assessmentId: assessment.id,
        order: 1,
      },
    },
    update: {
      content: 'React hook nào dùng để quản lý state?',
      type: 'SINGLE_CHOICE',
    },
    create: {
      id: 'question_front_01',
      assessmentId: assessment.id,
      content: 'React hook nào dùng để quản lý state?',
      type: 'SINGLE_CHOICE',
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const question2 = await prisma.assessmentQuestion.upsert({
    where: {
      uk_assessment_question_order: {
        assessmentId: assessment.id,
        order: 2,
      },
    },
    update: {
      content: 'Những công nghệ nào thường dùng với frontend?',
      type: 'MULTIPLE_CHOICE',
    },
    create: {
      id: 'question_front_02',
      assessmentId: assessment.id,
      content: 'Những công nghệ nào thường dùng với frontend?',
      type: 'MULTIPLE_CHOICE',
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const question3 = await prisma.assessmentQuestion.upsert({
    where: {
      uk_assessment_question_order: {
        assessmentId: assessment.id,
        order: 3,
      },
    },
    update: {
      content: 'TypeScript có phải là superset của JavaScript không?',
      type: 'SINGLE_CHOICE',
    },
    create: {
      id: 'question_front_03',
      assessmentId: assessment.id,
      content: 'TypeScript có phải là superset của JavaScript không?',
      type: 'SINGLE_CHOICE',
      order: 3,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const option1 = await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question1.id,
        order: 1,
      },
    },
    update: {
      content: 'useState',
      isCorrect: true,
    },
    create: {
      id: 'option_front_01a',
      questionId: question1.id,
      content: 'useState',
      isCorrect: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question1.id,
        order: 2,
      },
    },
    update: {
      content: 'useEffect',
      isCorrect: false,
    },
    create: {
      id: 'option_front_01b',
      questionId: question1.id,
      content: 'useEffect',
      isCorrect: false,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question1.id,
        order: 3,
      },
    },
    update: {
      content: 'useMemo',
      isCorrect: false,
    },
    create: {
      id: 'option_front_01c',
      questionId: question1.id,
      content: 'useMemo',
      isCorrect: false,
      order: 3,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const option2a = await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question2.id,
        order: 1,
      },
    },
    update: {
      content: 'React',
      isCorrect: true,
    },
    create: {
      id: 'option_front_02a',
      questionId: question2.id,
      content: 'React',
      isCorrect: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const option2b = await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question2.id,
        order: 2,
      },
    },
    update: {
      content: 'TypeScript',
      isCorrect: true,
    },
    create: {
      id: 'option_front_02b',
      questionId: question2.id,
      content: 'TypeScript',
      isCorrect: true,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question2.id,
        order: 3,
      },
    },
    update: {
      content: 'CSS',
      isCorrect: true,
    },
    create: {
      id: 'option_front_02c',
      questionId: question2.id,
      content: 'CSS',
      isCorrect: true,
      order: 3,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question2.id,
        order: 4,
      },
    },
    update: {
      content: 'PostgreSQL',
      isCorrect: false,
    },
    create: {
      id: 'option_front_02d',
      questionId: question2.id,
      content: 'PostgreSQL',
      isCorrect: false,
      order: 4,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const option3a = await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question3.id,
        order: 1,
      },
    },
    update: {
      content: 'True',
      isCorrect: true,
    },
    create: {
      id: 'option_front_03a',
      questionId: question3.id,
      content: 'True',
      isCorrect: true,
      order: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.assessmentOption.upsert({
    where: {
      uk_assessment_option_order: {
        questionId: question3.id,
        order: 2,
      },
    },
    update: {
      content: 'False',
      isCorrect: false,
    },
    create: {
      id: 'option_front_03b',
      questionId: question3.id,
      content: 'False',
      isCorrect: false,
      order: 2,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Assessment questions/options');

  /*
   * ============================================================
   * 24. ASSESSMENT RESULT
   * ============================================================
   */

  const result = await prisma.assessmentResult.upsert({
    where: {
      id: 'assessment_result_dev_01',
    },
    update: {
      score: 100,
      result: 'PASSED',
      takenAt: NOW,
    },
    create: {
      id: 'assessment_result_dev_01',
      userId: developer.id,
      assessmentId: assessment.id,
      score: 100,
      result: 'PASSED',
      takenAt: NOW,
    },
  });

  /*
   * ============================================================
   * 25. ASSESSMENT ANSWERS
   * ============================================================
   */

  const answer1 = await prisma.assessmentAnswer.upsert({
    where: {
      uk_assessment_answer_question: {
        assessmentResultId: result.id,
        questionId: question1.id,
      },
    },
    update: {},
    create: {
      id: 'answer_dev_q1',
      assessmentResultId: result.id,
      questionId: question1.id,
    },
  });

  const answer2 = await prisma.assessmentAnswer.upsert({
    where: {
      uk_assessment_answer_question: {
        assessmentResultId: result.id,
        questionId: question2.id,
      },
    },
    update: {},
    create: {
      id: 'answer_dev_q2',
      assessmentResultId: result.id,
      questionId: question2.id,
    },
  });

  const answer3 = await prisma.assessmentAnswer.upsert({
    where: {
      uk_assessment_answer_question: {
        assessmentResultId: result.id,
        questionId: question3.id,
      },
    },
    update: {},
    create: {
      id: 'answer_dev_q3',
      assessmentResultId: result.id,
      questionId: question3.id,
    },
  });

  /*
   * ============================================================
   * 26. ANSWER OPTIONS
   * ============================================================
   */

  await prisma.assessmentAnswerOption.upsert({
    where: {
      answerId_optionId: {
        answerId: answer1.id,
        optionId: option1.id,
      },
    },
    update: {},
    create: {
      answerId: answer1.id,
      optionId: option1.id,
    },
  });

  for (const option of [option2a, option2b]) {
    await prisma.assessmentAnswerOption.upsert({
      where: {
        answerId_optionId: {
          answerId: answer2.id,
          optionId: option.id,
        },
      },
      update: {},
      create: {
        answerId: answer2.id,
        optionId: option.id,
      },
    });
  }

  await prisma.assessmentAnswerOption.upsert({
    where: {
      answerId_optionId: {
        answerId: answer3.id,
        optionId: option3a.id,
      },
    },
    update: {},
    create: {
      answerId: answer3.id,
      optionId: option3a.id,
    },
  });

  console.log('✓ Assessment result/answers');

  /*
   * ============================================================
   * 27. PARTICIPATION
   * ============================================================
   */

  const participation = await prisma.participation.upsert({
    where: { id: 'participation_dev_project' },
    update: {
      intent: 'JOIN_PROJECT',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
    create: {
      id: 'participation_dev_project',
      userId: developer.id,
      projectId: project.id,
      intent: 'JOIN_PROJECT',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const participationDesigner = await prisma.participation.upsert({
    where: { id: 'participation_design_project' },
    update: {
      intent: 'JOIN_PROJECT',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
    },
    create: {
      id: 'participation_design_project',
      userId: designer.id,
      projectId: project.id,
      intent: 'JOIN_PROJECT',
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Participations');

  /*
   * ============================================================
   * 28. PARTICIPATION CONTRIBUTIONS
   * ============================================================
   */

  await prisma.participationContribution.upsert({
    where: {
      uk_participation_user_contribution: {
        participationId: participation.id,
        userContributionId: userContributionFrontend.id,
      },
    },
    update: {},
    create: {
      id: 'pc_dev_frontend',
      participationId: participation.id,
      userContributionId: userContributionFrontend.id,
    },
  });

  await prisma.participationContribution.upsert({
    where: {
      uk_participation_user_contribution: {
        participationId: participation.id,
        userContributionId: userContributionBackend.id,
      },
    },
    update: {},
    create: {
      id: 'pc_dev_backend',
      participationId: participation.id,
      userContributionId: userContributionBackend.id,
    },
  });

  await prisma.participationContribution.upsert({
    where: {
      uk_participation_user_contribution: {
        participationId: participationDesigner.id,
        userContributionId: userContributionUIUX.id,
      },
    },
    update: {},
    create: {
      id: 'pc_designer_uiux',
      participationId: participationDesigner.id,
      userContributionId: userContributionUIUX.id,
    },
  });

  console.log('✓ Participation contributions');

  /*
   * ============================================================
   * 29. COMMUNITY FEEDBACK
   * ============================================================
   */

  await prisma.communityFeedback.upsert({
    where: {
      uk_participation_feedback: {
        participationId: participation.id,
        reviewerId: founder.id,
        reviewedUserId: developer.id,
      },
    },
    update: {
      communication: 5,
      reliability: 5,
      collaboration: 4,
      professionalism: 5,
      comment: 'Làm việc tốt, phản hồi nhanh và có trách nhiệm.',
    },
    create: {
      id: 'feedback_founder_dev',
      participationId: participation.id,
      reviewerId: founder.id,
      reviewedUserId: developer.id,
      communication: 5,
      reliability: 5,
      collaboration: 4,
      professionalism: 5,
      comment: 'Làm việc tốt, phản hồi nhanh và có trách nhiệm.',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  await prisma.communityFeedback.upsert({
    where: {
      uk_participation_feedback: {
        participationId: participationDesigner.id,
        reviewerId: founder.id,
        reviewedUserId: designer.id,
      },
    },
    update: {
      communication: 4,
      reliability: 5,
      collaboration: 5,
      professionalism: 4,
      comment: 'Phối hợp tốt và chủ động trong công việc.',
    },
    create: {
      id: 'feedback_founder_design',
      participationId: participationDesigner.id,
      reviewerId: founder.id,
      reviewedUserId: designer.id,
      communication: 4,
      reliability: 5,
      collaboration: 5,
      professionalism: 4,
      comment: 'Phối hợp tốt và chủ động trong công việc.',
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  console.log('✓ Community feedback');

  /*
   * ============================================================
   * 30. REFRESH TOKEN
   * ============================================================
   */

  await prisma.refreshToken.upsert({
    where: {
      tokenHash: 'seed-refresh-token-hash-001',
    },
    update: {
      userId: founder.id,
      accountId: founderAccount.id,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      revokedAt: null,
    },
    create: {
      id: 'refresh_seed_001',
      userId: founder.id,
      accountId: founderAccount.id,
      tokenHash: 'seed-refresh-token-hash-001',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      createdAt: NOW,
    },
  });

  /*
   * ============================================================
   * 31. REACTIVATION TOKEN
   * ============================================================
   */

  await prisma.reactivationToken.upsert({
    where: {
      id: 'reactivation_seed_01',
    },
    update: {
      tokenHash: 'seed-reactivation-token-hash-001',
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      usedAt: null,
    },
    create: {
      id: 'reactivation_seed_01',
      userId: founder.id,
      tokenHash: 'seed-reactivation-token-hash-001',
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      createdAt: NOW,
    },
  });

  /*
   * ============================================================
   * 32. PASSWORD RESET TOKEN
   * ============================================================
   */

  await prisma.passwordResetToken.upsert({
    where: {
      tokenHash: 'seed-password-reset-token-hash-001',
    },
    update: {
      accountId: developerAccount.id,
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      usedAt: null,
    },
    create: {
      id: 'password_reset_seed',
      accountId: developerAccount.id,
      tokenHash: 'seed-password-reset-token-hash-001',
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      createdAt: NOW,
    },
  });

  /*
   * ============================================================
   * 33. EMAIL VERIFICATION TOKEN
   * ============================================================
   */

  await prisma.emailVerificationToken.upsert({
    where: {
      tokenHash: 'seed-email-verification-hash-001',
    },
    update: {
      accountId: designerAccount.id,
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      usedAt: null,
    },
    create: {
      id: 'email_verify_seed',
      accountId: designerAccount.id,
      tokenHash: 'seed-email-verification-hash-001',
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
      createdAt: NOW,
    },
  });

  console.log('✓ Auth tokens');

  /*
   * ============================================================
   * SUMMARY
   * ============================================================
   */

  console.log('');
  console.log('========================================');
  console.log('DATABASE SEED COMPLETED');
  console.log('========================================');

  console.log('');
  console.log('Test accounts:');
  console.log('  founder@example.com   / Password@123');
  console.log('  developer@example.com / Password@123');
  console.log('  designer@example.com  / Password@123');
  console.log('  investor@example.com  / Password@123');

  console.log('');
  console.log('Master IDs:');
  console.log(`  FIELD Tech       : ${categories.fieldTech.id}`);
  console.log(`  FIELD Business   : ${categories.fieldBusiness.id}`);
  console.log(`  FIELD Education  : ${categories.fieldEducation.id}`);
  console.log(`  Web Development  : ${niches.nicheWeb.id}`);
  console.log(`  AI               : ${niches.nicheAI.id}`);

  console.log('');
  console.log(`Project ID: ${project.id}`);
  console.log(`Assessment ID: ${assessment.id}`);
}

main()
  .catch((error) => {
    console.error('');
    console.error('========================================');
    console.error('DATABASE SEED FAILED');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
