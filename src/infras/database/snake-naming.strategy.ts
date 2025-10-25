import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export class SnakeNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    /**
     * Convert camelCase to snake_case
     */
    private toSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    }

    public tableName(
        targetName: string,
        userSpecifiedName: string | undefined,
    ): string {
        return userSpecifiedName
            ? userSpecifiedName
            : this.toSnakeCase(targetName);
    }

    public columnName(
        propertyName: string,
        customName: string | undefined,
        embeddedPrefixes: string[],
    ): string {
        const name = customName ? customName : this.toSnakeCase(propertyName);

        if (embeddedPrefixes.length) {
            return (
                embeddedPrefixes
                    .map((prefix) => this.toSnakeCase(prefix))
                    .join('_') +
                '_' +
                name
            );
        }

        return name;
    }

    public relationName(propertyName: string): string {
        return this.toSnakeCase(propertyName);
    }

    public joinColumnName(
        relationName: string,
        referencedColumnName: string,
    ): string {
        return this.toSnakeCase(relationName) + '_' + referencedColumnName;
    }

    public joinTableName(
        firstTableName: string,
        secondTableName: string,
        firstPropertyName: string,
        secondPropertyName: string,
    ): string {
        return (
            this.toSnakeCase(firstTableName) +
            '_' +
            this.toSnakeCase(firstPropertyName.replace(/\./gi, '_')) +
            '_' +
            this.toSnakeCase(secondTableName)
        );
    }

    public joinTableColumnName(
        tableName: string,
        propertyName: string,
        columnName?: string,
    ): string {
        return (
            this.toSnakeCase(tableName) +
            '_' +
            (columnName ? columnName : propertyName)
        );
    }

    public classTableInheritanceParentColumnName(
        parentTableName: any,
        parentTableIdPropertyName: any,
    ): string {
        return (
            this.toSnakeCase(parentTableName) + '_' + parentTableIdPropertyName
        );
    }

    public eagerJoinRelationAlias(alias: string, propertyPath: string): string {
        return alias + '__' + propertyPath.replace('.', '_');
    }
}
