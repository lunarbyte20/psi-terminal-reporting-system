import { t, useLocale } from '@/lib/i18n';
import { Link } from '@inertiajs/react';
import {
    ChevronDown,
    Eye,
    FileDown,
    FileSpreadsheet,
    FileText,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Every report and download for one reporting week or month, in one place:
 * the printable management report (view it, or print / save it as PDF)
 * and the terminal sales spreadsheets (Excel, CSV).
 */
export function ReportExportsMenu({
    period,
    periodTitle,
    canViewManagementReport,
    size = 'sm',
    label = 'Reports & exports',
}: {
    /** A reporting week id ("42") or a month ("2026-11"). */
    period: string | number;
    periodTitle: string;
    canViewManagementReport: boolean;
    size?: 'sm' | 'default';
    label?: string;
}) {
    useLocale();
    const base = `/dashboard/${period}`;
    const report = `${base}/management-report`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={size}
                    aria-label={`${label} for ${periodTitle}`}
                >
                    <FileDown aria-hidden="true" />
                    <span>{t(label)}</span>
                    <ChevronDown aria-hidden="true" className="opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {periodTitle}
                </DropdownMenuLabel>
                {canViewManagementReport && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                {t('Management report')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={report} className="cursor-pointer">
                                    <Eye aria-hidden="true" />
                                    {t('View report')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href={`${report}?print=1`}
                                    className="cursor-pointer"
                                >
                                    <Printer aria-hidden="true" />
                                    {t('Print or save as PDF')}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] tracking-wider text-muted-foreground uppercase">
                        {t('Terminal sales spreadsheet')}
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <a
                            href={`${base}/terminal-sales.xlsx`}
                            className="cursor-pointer"
                        >
                            <FileSpreadsheet aria-hidden="true" />
                            {t('Excel (.xlsx)')}
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <a
                            href={`${base}/terminal-sales.csv`}
                            className="cursor-pointer"
                        >
                            <FileText aria-hidden="true" />
                            {t('CSV')}
                        </a>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
