import { Catalog } from './entities/catalog.entity';
import { CatalogOption } from './entities/catalog-option.entity';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogsService } from './services/catalogs.service';
import { FolioFormatterService } from './services/folio-formatter.service';
import { Module } from '@nestjs/common';
import { NumberSequence } from './entities/number-sequence.entity';
import { PublicSettingsController } from './controllers/public-settings.controller';
import { PublicSettingsService } from './services/public-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingRepository } from './repositories/system-setting.repository';
import { TaxRate } from './entities/tax-rate.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemSetting,
      Catalog,
      CatalogOption,
      NumberSequence,
      TaxRate,
    ]),
  ],
  controllers: [PublicSettingsController],
  providers: [
    CatalogRepository,
    SystemSettingRepository,
    CatalogsService,
    FolioFormatterService,
    PublicSettingsService,
  ],
})
export class PlatformModule {}
