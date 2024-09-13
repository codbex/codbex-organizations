import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface OrganizationEntity {
    readonly Id: number;
    Name?: string;
    CostCenter?: string;
    Company?: number;
}

export interface OrganizationCreateEntity {
    readonly Name?: string;
    readonly CostCenter?: string;
    readonly Company?: number;
}

export interface OrganizationUpdateEntity extends OrganizationCreateEntity {
    readonly Id: number;
}

export interface OrganizationEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            CostCenter?: string | string[];
            Company?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            CostCenter?: string | string[];
            Company?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            CostCenter?: string;
            Company?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            CostCenter?: string;
            Company?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            CostCenter?: string;
            Company?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            CostCenter?: string;
            Company?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            CostCenter?: string;
            Company?: number;
        };
    },
    $select?: (keyof OrganizationEntity)[],
    $sort?: string | (keyof OrganizationEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface OrganizationEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<OrganizationEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface OrganizationUpdateEntityEvent extends OrganizationEntityEvent {
    readonly previousEntity: OrganizationEntity;
}

export class OrganizationRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_ORGANIZATION",
        properties: [
            {
                name: "Id",
                column: "ORGANIZATION_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "ORGANIZATION_NAME",
                type: "VARCHAR",
            },
            {
                name: "CostCenter",
                column: "ORGANIZATION_COSTCENTER",
                type: "VARCHAR",
            },
            {
                name: "Company",
                column: "ORGANIZATION_COMPANY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(OrganizationRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: OrganizationEntityOptions): OrganizationEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): OrganizationEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: OrganizationCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_ORGANIZATION",
            entity: entity,
            key: {
                name: "Id",
                column: "ORGANIZATION_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: OrganizationUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_ORGANIZATION",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "ORGANIZATION_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: OrganizationCreateEntity | OrganizationUpdateEntity): number {
        const id = (entity as OrganizationUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as OrganizationUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "CODBEX_ORGANIZATION",
            entity: entity,
            key: {
                name: "Id",
                column: "ORGANIZATION_ID",
                value: id
            }
        });
    }

    public count(options?: OrganizationEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_ORGANIZATION"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: OrganizationEntityEvent | OrganizationUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-organizations-Organizations-Organization", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-organizations-Organizations-Organization").send(JSON.stringify(data));
    }
}
