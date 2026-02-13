'use server';

import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AdBanner } from '@prisma/client';

/**
 * Uploads an image to Vercel Blob and creates an AdBanner record.
 */
export async function uploadAdBanner(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;

        if (!file || !title) {
            return { error: 'Falta archivo o título' };
        }

        // 1. Upload to Vercel Blob
        // Ensure token is present
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error("Missing BLOB_READ_WRITE_TOKEN");
            return { error: 'Error de configuración: Falta Token de Blob' };
        }

        const blob = await put(`ads/${file.name}`, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly pass token
        });

        // 2. Create DB Record
        const ad = await prisma.adBanner.create({
            data: {
                title,
                imageUrl: blob.url,
                active: true, // Auto-activate on upload
            }
        });

        revalidatePath('/dashboard/marketing');
        return { success: true, ad };

    } catch (error: any) {
        console.error('Error uploading ad:', error);
        // Extract inner Vercel Blob error if available
        const msg = error.message || 'Error desconocido';
        return { error: `Error al subir imagen: ${msg}` };
    }
}

/**
 * Toggles the active status of an ad.
 */
export async function toggleAdStatus(id: string, isActive: boolean) {
    try {
        await prisma.adBanner.update({
            where: { id },
            data: { active: isActive }
        });
        revalidatePath('/dashboard/marketing');
        return { success: true };
    } catch (error) {
        return { error: 'Error al actualizar estado' };
    }
}

/**
 * Deletes an ad from DB and Blob storage.
 */
export async function deleteAd(id: string, imageUrl: string) {
    try {
        // 1. Delete from DB
        await prisma.adBanner.delete({
            where: { id }
        });

        // 2. Delete from Blob (Best effort, don't fail if already gone)
        // Extract relative path or full URL depending on how 'del' expects it. 
        // Vercel Blob 'del' usually accepts the full URL.
        await del(imageUrl);

        revalidatePath('/dashboard/marketing');
        return { success: true };
    } catch (error) {
        console.error('Error deleting ad:', error);
        return { error: 'Error al eliminar anuncio' };
    }
}

/**
 * Fetches all ads ordered by 'order' or creation date.
 */
export async function getAds() {
    try {
        const ads = await prisma.adBanner.findMany({
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        return ads;
    } catch (error) {
        return [];
    }
}
